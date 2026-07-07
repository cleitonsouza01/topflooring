# Estimate form anti-spam protection

## Context

The `/api/lead` Cloudflare Pages Function (`functions/api/lead.ts`) backs the estimate
form (`components/marketing/EstimateForm.tsx`, rendered once, via
`components/marketing/Estimate.tsx`). It currently has one anti-spam layer: a hidden
honeypot field (`company`) that, if filled, causes the request to be silently
accepted and dropped (`202`, no email sent).

This is preventive hardening — no spam has been observed yet — added before the site
sees real traffic volume. The goal is added protection with **zero friction** for real
visitors: nothing a human notices or has to solve.

The site is a fully static Next.js export (`output: 'export'`) on Cloudflare Pages, with
`reactStrictMode: true`. Two consequences drive the design below:

- `NEXT_PUBLIC_*` values are **inlined into the client bundle at build time** — they must
  be present in the Cloudflare Pages *build* environment, not the Functions secret store.
- In development, mount effects run **twice** (StrictMode). Anything done on mount
  (loading the Turnstile script, rendering the widget, recording the load time) must be
  idempotent.

## Approach

Three independent layers stack on top of the existing honeypot, each catching a
different class of bot. None of them can block a real lead on their own (see
"Fail-open policy" below).

1. **Cloudflare Turnstile** (non-interactive/invisible widget) — verifies the browser
   is running a real, non-automated session. The client obtains a token from
   Cloudflare's script; the server validates that token with Cloudflare's `siteverify`
   API before treating the lead as trustworthy.
2. **Time-trap** — the client records when the form mounted; the server rejects
   submissions completed implausibly fast for a human (default threshold: 800ms of
   *server-perceived* elapsed time; see "Time-trap threshold & clock skew" for why this
   is lower than a naïve guess and how the cross-clock comparison is handled safely).
3. **Honeypot** (existing, unchanged) — hidden `company` field; any non-empty value
   means a bot filled every field programmatically.

Rough division of labor: the honeypot and Turnstile carry the load (near-zero
false-positive rate); the time-trap is a cheap backstop for the crudest scripted
submits and is deliberately tuned conservative because it is the only layer that can
silently drop a real lead with no third party involved.

### Fail-open policy

If Turnstile can't produce a token (script blocked by an ad blocker, slow network,
Cloudflare siteverify outage/timeout, missing secret, etc.), **the submission still
succeeds.** Turnstile is a bonus signal, not a gate. Never losing a real customer lead
over a third-party script failure takes priority over blocking marginal spam. The
time-trap and honeypot remain as fallback filters in that case.

The same principle governs the time-trap: any `formLoadedAt` value that isn't an
unambiguous "too fast" signal (missing, malformed, in the future, or a normal elapsed
time) passes through. When in doubt, let the lead through.

## Components touched

### `components/marketing/EstimateForm.tsx`

- Load the Turnstile client script (`https://challenges.cloudflare.com/turnstile/v0/api.js`)
  once. Guard against StrictMode's double-mount and against a second copy if the script
  tag already exists (`document.querySelector` on the src, or a module-level "loaded"
  flag) — do not append it twice.
- Render an **explicitly-managed** invisible Turnstile widget via `turnstile.render()`
  into a ref'd container (not implicit auto-rendering, which is harder to make
  StrictMode-safe), using `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and
  `appearance: 'interaction-only'` (the widget only becomes visible if Cloudflare
  decides a specific visitor needs an interactive challenge — expected to be rare).
  Keep the returned widget id so it can be reset (below). Render exactly one widget even
  under double-mount.
- Capture the token via the widget's `callback` into a ref (preferred over reading
  `turnstile.getResponse()` at submit time, which can race the widget).
- Record `formLoadedAt = Date.now()` once on mount (a `useRef`/state initializer, not
  recomputed on every render, and not reset by the StrictMode remount).
- On submit, include in the JSON POST body:
  - `turnstileToken`: the token captured from the widget, or omitted/empty if none yet.
  - `formLoadedAt`: the recorded mount timestamp (a number of ms since epoch).
- Do **not** block or delay submission waiting for a token — if the widget hasn't
  produced one yet by the time the user clicks submit, submit anyway without it. In the
  rare interactive-challenge case the widget appears but submission is never gated on
  it; worst case the token is simply absent and the server fails open.
- **Reset the widget after each submit attempt** (`turnstile.reset(widgetId)`), including
  after a `422` validation error, so a retry carries a *fresh* token. Turnstile tokens
  are single-use and expire after ~300s; reusing one yields a `siteverify` failure. That
  failure is harmless here (fail-open), but resetting avoids the wasted round-trip and
  keeps a genuine second submission verifiable.

### `functions/api/lead.ts`

Add to the `Env` interface:

```ts
TURNSTILE_SECRET_KEY?: string; // optional — absent means Turnstile verification is skipped (fail-open)
```

Extend `LeadPayload` with `turnstileToken?: string` and `formLoadedAt?: number`.

Check order (each still-silent as today where applicable):

1. Honeypot (`company` filled) → `202`, silently dropped. *(unchanged)*
2. Time-trap: fires **only** when `formLoadedAt` is a finite number, is not in the
   future (`formLoadedAt <= Date.now()`), and the elapsed time is a positive value below
   the threshold (`0 <= Date.now() - formLoadedAt < THRESHOLD_MS`, default `800`). On a
   hit → `202`, silently dropped, using the **same response shape** as the honeypot (a
   bot must not be able to tell which check caught it). Any other value — absent, `NaN`,
   a string, negative, or in the future — is ignored and falls through (fail-open). Emit
   a server-side observability log on a hit (see "Observability").
3. Field validation (name/phone/email/service) → `422` with field errors. *(unchanged)*
   Runs before Turnstile so a legitimate user fixing a typo never consumes their token.
4. Turnstile verification — **only if `turnstileToken` is present and
   `TURNSTILE_SECRET_KEY` is set**:
   - POST to `https://challenges.cloudflare.com/turnstile/v0/siteverify` with
     `secret` (`env.TURNSTILE_SECRET_KEY`), `response` (the token), and `remoteip`
     (from the `CF-Connecting-IP` request header, if present).
   - Wrap the call in an explicit timeout (`AbortController`, ~3s). `fetch` has **no
     default timeout**; without this, a hung Cloudflare siteverify would hang the whole
     lead request and cost a real lead — the opposite of fail-open.
   - If the call throws, aborts/times out, or Cloudflare returns `success: false` —
     **do not reject the request.** Log a warning server-side (see "Observability") and
     proceed as if no token had been sent (fail-open). This keeps behavior identical to
     the "no token" case.
   - If `turnstileToken` is absent, or `TURNSTILE_SECRET_KEY` is unset (e.g. a
     misconfigured or preview deploy), skip this step outright — no verification call,
     no penalty. This is the expected common case when the widget hasn't resolved yet or
     is blocked.
5. Existing mailer logic (notifygw fan-out) — unchanged.

## Time-trap threshold & clock skew

Two things make the time-trap the most delicate layer, and both push toward a **lower,
conservative threshold** rather than the intuitive "a human needs a second or two":

- **Autofill.** A returning visitor whose browser autofills name/phone/email, taps a
  service, and hits submit can legitimately complete the form in well under 1.5s. A
  threshold set too high silently eats exactly the hottest leads (repeat/known
  customers). Scripted submits, by contrast, complete in tens of milliseconds. The gap
  is enormous, so dropping the threshold from 1500ms to **800ms** costs essentially no
  bot-catching while materially cutting false positives. (Tune with real data later; err
  low.)
- **Cross-clock comparison.** `formLoadedAt` is stamped by the *client* clock; the
  server compares it against the *server* clock. These are independent and can differ by
  minutes. The guard handles this by only ever firing on a clean positive-and-small
  elapsed value: a client clock running *ahead* yields a future or negative-elapsed
  value → ignored (fail-open); a client clock running *behind* yields a large elapsed
  value → passes normally. The one residual false-positive window is a client clock
  running ahead by *almost exactly* the true fill time, which is rare and shrinks with
  the lower threshold. Accepted as a known residual risk (see "Risks & residual gaps").

Define `THRESHOLD_MS` as a single named constant so it's trivial to tune.

## Observability

Every filter in this design drops a request to a silent `202`, and the client renders
the "Thank you!" screen for any `2xx`. That means a false positive — a real lead caught
by the time-trap or a Turnstile misfire — is **completely invisible**: the visitor
believes they succeeded, and no email is ever sent. For a preventive measure whose worst
failure mode is "silently dropped a paying customer," blind spots are unacceptable.

Add minimal, server-side-only logging (visible in Cloudflare Pages Function logs /
`wrangler pages deployment tail`), one tagged line per event, no PII beyond what's
already logged:

- Honeypot hit (currently silent — add a log too, for a consistent baseline).
- Time-trap hit — include the computed elapsed ms, so a cluster of "just under
  threshold" hits (the false-positive signature) is spottable.
- Turnstile `success: false` and Turnstile call error/timeout (the spec's existing
  warning) — distinguish the two.

These logs are the only way to answer "is this catching bots, or eating customers?"
after launch. No dashboard or storage needed at this stage — grep-able logs suffice.

## Configuration

Two new variables, in two different places (this matters — mixing them up causes
exactly the kind of bug fixed earlier this week where a var was set in the wrong
config surface):

| Variable | Visibility | Where it's read | Where it must be set |
|---|---|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public (safe to expose) | Next.js, at **build time** (same mechanism as `NEXT_PUBLIC_SITE_URL`, via `lib/business.ts` / `lib/seo.ts` patterns) | Local: `.env`. Production: Cloudflare Pages **build-time** environment variables (Settings → Environment variables → Production, NOT the Functions-only secret store). |
| `TURNSTILE_SECRET_KEY` | Secret | `functions/api/lead.ts`, at **request time** | Local: `.dev.vars`. Production: Cloudflare Pages **Function secret** (same place `NOTIFYGW_API_KEY` lives — via `wrangler pages secret put`). |

Because `TURNSTILE_SECRET_KEY` is optional (absent → skip verification, fail-open), a
build or preview deploy that has the site key but not the secret degrades gracefully
rather than erroring.

A Turnstile widget (site key + secret pair) must exist in the Cloudflare dashboard
before these can be filled in. During implementation this will be attempted via the
Cloudflare API using the existing wrangler OAuth session; if that token lacks
Turnstile scope, it'll need to be created manually in the dashboard (Turnstile section
→ Add widget → widget mode **"Managed"** — this is required for the client's
`appearance: 'interaction-only'` to work; Non-Interactive/Invisible modes never surface
a challenge and ignore that appearance — hostnames `topflooringorlando.com`,
`www.topflooringorlando.com`, plus `localhost`/`127.0.0.1` for local dev) and the
resulting keys handed over.

(Confirmed during implementation: the wrangler OAuth token lacks Turnstile scope, so the
widget must be created via the dashboard or a purpose-scoped API token — automatic
creation via the existing wrangler session is not possible.)

For local development and tests, Cloudflare publishes fixed test site keys/secrets
that always pass (or always fail) without making real network calls — used in
`.dev.vars` and the local dev flow so local testing never depends on the live
Turnstile service.

**CSP note:** the site ships no Content-Security-Policy today, so Turnstile's script and
iframe load freely. If a CSP is ever added, it must allow `https://challenges.cloudflare.com`
in both `script-src` and `frame-src` — call this out then so the widget doesn't silently
break.

## Testing

- Extend `tests/lead.test.ts` (add `TURNSTILE_SECRET_KEY` to the shared test `env`;
  keep a variant without it for the fail-open case):
  - Time-trap: `formLoadedAt` a finite ms value less than `THRESHOLD_MS` in the past →
    `202`, mailer not called.
  - Time-trap: `formLoadedAt` comfortably older than the threshold → proceeds normally.
  - Time-trap: no `formLoadedAt` (e.g. an older client) → not rejected; falls through to
    normal validation. The check only fires when the field is present and too recent, so
    it can't break existing behavior for requests that predate this field.
  - Time-trap: `formLoadedAt` **in the future** (client clock ahead) → not rejected
    (fail-open on negative elapsed).
  - Time-trap: `formLoadedAt` **malformed** (string, `NaN`, negative number) → not
    rejected (ignored, falls through).
  - Turnstile: token present + secret set + `siteverify` mock returns `success: true` →
    proceeds; assert the outbound call carries the correct `secret` and the `remoteip`
    from `CF-Connecting-IP`.
  - Turnstile: token present + `siteverify` mock returns `success: false` → **still
    proceeds** (fail-open), mailer still called.
  - Turnstile: token present + `siteverify` mock throws/rejects → still proceeds
    (fail-open).
  - Turnstile: token present but `TURNSTILE_SECRET_KEY` **unset** → `siteverify` never
    called, proceeds normally (fail-open).
  - Turnstile: token absent → `siteverify` is never called (no fetch to that URL),
    proceeds normally.
- Note on the timeout: assert the fail-open path (throw/reject) works; a real wall-clock
  timeout test is not worth the flakiness — verifying the `AbortController` is wired and
  the abort branch is treated as fail-open is enough.
- Manual end-to-end verification via chrome-devtools MCP:
  - Local: `wrangler pages dev` with Cloudflare's test site key, confirm normal
    submission still returns `200` / shows "Thank you!".
  - Local: confirm the widget renders exactly once under React StrictMode (no duplicate
    Turnstile iframe / no doubled script tag in the DOM).
  - Production: one live smoke test after deploy, confirming `200` and the
    confirmation screen, same as prior verification passes on this form. Tail the
    Function logs during the smoke test to confirm the observability lines appear as
    expected and that a normal submission trips **no** filter.

## Risks & residual gaps

- **Time-trap false positive (accepted).** A visitor whose client clock runs ahead by
  almost exactly their true fill time could be silently dropped. Mitigated by the low
  threshold and made *detectable* (not preventable) by the observability logging. If the
  logs show real hits clustered just under the threshold, lower it further or drop the
  time-trap entirely — the honeypot and Turnstile do the real work.
- **Turnstile token reuse on rapid resubmit.** A user who submits twice quickly may send
  a stale token on the second try; it fails `siteverify` → fail-open → still delivered.
  Harmless, and the client widget reset minimizes it.
- **Silent success on drop.** By design, a dropped submission shows the same success UI
  as a delivered one. This is intentional (don't tip off bots) but means the *only*
  signal of a wrongly-dropped lead is the server log — hence observability is a hard
  requirement of this design, not a nice-to-have.

## Out of scope (for this spec)

- IP-based rate limiting (would need a Cloudflare KV namespace) — not needed yet per
  "preventive, not currently under attack"; can be layered in later if spam volume
  actually appears.
- Cloudflare-zone-level Bot Fight Mode / Super Bot Fight Mode — a dashboard-only,
  zone-wide toggle independent of this form's code; worth turning on separately but
  not part of this change.
- Blocklisting content patterns (URLs/keywords in `details`) — not needed at
  "preventive" stage.
- Persisting dropped-lead events to storage / alerting — the server logs above are the
  stopgap; a real audit trail can come later if the volume justifies it.
