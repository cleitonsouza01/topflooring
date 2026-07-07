# Estimate form anti-spam protection

## Context

The `/api/lead` Cloudflare Pages Function (`functions/api/lead.ts`) backs the estimate
form (`components/marketing/EstimateForm.tsx`). It currently has one anti-spam layer: a
hidden honeypot field (`company`) that, if filled, causes the request to be silently
accepted and dropped (`202`, no email sent).

This is preventive hardening — no spam has been observed yet — added before the site
sees real traffic volume. The goal is added protection with **zero friction** for real
visitors: nothing a human notices or has to solve.

## Approach

Three independent layers stack on top of the existing honeypot, each catching a
different class of bot. None of them can block a real lead on their own (see
"Fail-open policy" below).

1. **Cloudflare Turnstile** (non-interactive/invisible widget) — verifies the browser
   is running a real, non-automated session. The client obtains a token from
   Cloudflare's script; the server validates that token with Cloudflare's `siteverify`
   API before treating the lead as trustworthy.
2. **Time-trap** — the client records when the form mounted; the server rejects
   submissions completed faster than a human plausibly could (threshold: 1500ms from
   page load to submit).
3. **Honeypot** (existing, unchanged) — hidden `company` field; any non-empty value
   means a bot filled every field programmatically.

### Fail-open policy

If Turnstile can't produce a token (script blocked by an ad blocker, slow network,
Cloudflare siteverify outage, etc.), **the submission still succeeds.** Turnstile is a
bonus signal, not a gate. Never losing a real customer lead over a third-party script
failure takes priority over blocking marginal spam. The time-trap and honeypot remain
as fallback filters in that case.

## Components touched

### `components/marketing/EstimateForm.tsx`

- Load the Turnstile client script (`https://challenges.cloudflare.com/turnstile/v0/api.js`)
  once, on mount.
- Render an invisible Turnstile widget (`data-appearance="interaction-only"`, so it's
  only visible if Cloudflare decides an interactive challenge is needed for a specific
  visitor — expected to be rare) inside the `<form>`, using
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
- Record `formLoadedAt = Date.now()` once on mount (component state initializer).
- On submit, include in the JSON POST body:
  - `turnstileToken`: the token from the widget, or omitted/empty if not yet available.
  - `formLoadedAt`: the recorded mount timestamp.
- Do **not** block or delay submission waiting for a token — if the widget hasn't
  produced one yet by the time the user clicks submit, submit anyway without it.

### `functions/api/lead.ts`

Check order (each still-silent as today where applicable):

1. Honeypot (`company` filled) → `202`, silently dropped. *(unchanged)*
2. Time-trap: if `formLoadedAt` is present, well-formed, not in the future, and
   `Date.now() - formLoadedAt < 1500`, → `202`, silently dropped (same shape as the
   honeypot response — a bot should not be able to distinguish which check caught it).
3. Field validation (name/phone/email/service) → `422` with field errors. *(unchanged)*
4. Turnstile verification — **only if `turnstileToken` is present**:
   - POST to `https://challenges.cloudflare.com/turnstile/v0/siteverify` with
     `secret` (`env.TURNSTILE_SECRET_KEY`), `response` (the token), and `remoteip`
     (from the `CF-Connecting-IP` request header, if present).
   - If the call throws, times out, or Cloudflare returns `success: false` — **do not
     reject the request.** Log a warning server-side and proceed as if no token had
     been sent (fail-open). This keeps behavior identical to the "no token" case.
   - If `turnstileToken` is absent entirely, skip this step outright — no verification
     call is made, no penalty applied. This is the expected common case when the
     widget hasn't resolved yet or is blocked.
5. Existing mailer logic (notifygw fan-out) — unchanged.

## Configuration

Two new variables, in two different places (this matters — mixing them up causes
exactly the kind of bug fixed earlier this week where a var was set in the wrong
config surface):

| Variable | Visibility | Where it's read | Where it must be set |
|---|---|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public (safe to expose) | Next.js, at **build time** (same mechanism as `NEXT_PUBLIC_SITE_URL`, via `lib/business.ts` / `lib/seo.ts` patterns) | Local: `.env`. Production: Cloudflare Pages **build-time** environment variables (Settings → Environment variables → Production, NOT the Functions-only secret store). |
| `TURNSTILE_SECRET_KEY` | Secret | `functions/api/lead.ts`, at **request time** | Local: `.dev.vars`. Production: Cloudflare Pages **Function secret** (same place `NOTIFYGW_API_KEY` lives — via `wrangler pages secret put`). |

A Turnstile widget (site key + secret pair) must exist in the Cloudflare dashboard
before these can be filled in. During implementation this will be attempted via the
Cloudflare API using the existing wrangler OAuth session; if that token lacks
Turnstile scope, it'll need to be created manually in the dashboard (Turnstile section
→ Add widget → widget mode "Non-Interactive" or "Invisible", domain
`topflooringorlando.com`) and the resulting keys handed over.

For local development and tests, Cloudflare publishes fixed test site keys/secrets
that always pass (or always fail) without making real network calls — used in
`.dev.vars` and the local dev flow so local testing never depends on the live
Turnstile service.

## Testing

- Extend `tests/lead.test.ts`:
  - Time-trap: a request with `formLoadedAt` less than 1500ms in the past → `202`,
    mailer not called.
  - Time-trap: a request with no `formLoadedAt` (e.g. an older client) → not rejected
    by this check (falls through to normal validation) — time-trap only fires when the
    field is present and too recent, so it can't break existing behavior for requests
    that predate this field.
  - Turnstile: token present + `siteverify` mock returns `success: true` → proceeds
    normally.
  - Turnstile: token present + `siteverify` mock returns `success: false` → **still
    proceeds** (fail-open), mailer still called.
  - Turnstile: token present + `siteverify` mock throws/rejects → still proceeds
    (fail-open).
  - Turnstile: token absent → `siteverify` is never called (no fetch to that URL),
    proceeds normally.
- Manual end-to-end verification via chrome-devtools MCP:
  - Local: `wrangler pages dev` with Cloudflare's test site key, confirm normal
    submission still returns `200` / shows "Thank you!".
  - Production: one live smoke test after deploy, confirming `200` and the
    confirmation screen, same as prior verification passes on this form.

## Out of scope (for this spec)

- IP-based rate limiting (would need a Cloudflare KV namespace) — not needed yet per
  "preventive, not currently under attack"; can be layered in later if spam volume
  actually appears.
- Cloudflare-zone-level Bot Fight Mode / Super Bot Fight Mode — a dashboard-only,
  zone-wide toggle independent of this form's code; worth turning on separately but
  not part of this change.
- Blocklisting content patterns (URLs/keywords in `details`) — not needed at
  "preventive" stage.
