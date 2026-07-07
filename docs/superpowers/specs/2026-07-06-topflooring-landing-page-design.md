# Top Flooring Services — Landing Page (Design)

**Date:** 2026-07-06
**Status:** Approved scope, pending spec review
**Owner:** Cleiton Souza

---

## 1. Overview

Build the public marketing website for **Top Flooring Services LLC** (Orlando, FL) as a
Next.js App Router application, porting the existing **Design 5 — "Tile Motif / Geometric"**
static mockup into production React. Ship a fast, SEO-strong, single-page landing site with a
working lead-capture form that emails submissions to the business owner.

The site is **static** and deployed to **Cloudflare Pages**. There is no database and no CMS in
this phase. A blog (TinaCMS over git-backed MDX) and a daily AI post pipeline are **explicitly
deferred** to future phases and documented here only so this phase does not paint them into a
corner.

### Source material

- **Design mockup:** `topflooring-old/landingpage/design-5-tile-motif/index.html` (complete,
  self-contained HTML/Tailwind-CDN page — the visual + interaction reference of record).
- **Copy kit:** `topflooring-old/landingpage/CONTENT.md` (canonical conversion-focused copy —
  all landing-page text already exists; no new copywriting needed this phase).
- **Business facts:** `docs/Top_Flooring_Services_Marketing_Base.md` (NAP, services, service
  area, positioning — source for JSON-LD and metadata).
- **Assets:** `topflooring-old/landingpage/assets/` (23 project images, logo SVG/PNG, favicons,
  webmanifest).

---

## 2. Goals & non-goals

### Goals
1. Pixel-faithful, productionized port of Design 5 to Next.js + real Tailwind (no CDN).
2. Working lead form → email notification to the owner via notifygw.com (no DB).
3. Comprehensive SEO: metadata, JSON-LD LocalBusiness, sitemap, robots, manifest, clean URLs.
4. Strong Core Web Vitals (self-hosted fonts, pre-optimized images, minimal client JS).
5. Deployable to Cloudflare Pages with a simple `git push` → build → deploy flow.

### Non-goals (this phase)
- No blog, no MDX rendering, no TinaCMS, no CMS admin.
- No database, no server runtime beyond the single Pages Function for the lead form.
- No ISR / on-demand revalidation (the site is fully static; content changes = code deploys).
- No AI automation.
- No analytics/tracking integration (can be added later; not in scope).

---

## 3. Locked decisions (with rationale)

| Decision | Choice | Rationale |
|---|---|---|
| Framework | **Next.js (App Router)** | Requested stack; sets up cleanly for the future blog phase. |
| Rendering | **Static export** (`output: 'export'`) | Landing page is fully static; simplest + fastest on Cloudflare Pages. |
| Host | **Cloudflare Pages** | Simple static hosting + Pages Functions for the one dynamic endpoint. |
| CSS | **Tailwind CSS** (installed, not CDN) | Matches the mockup's utility approach; port the inline theme tokens. |
| Fonts | **`next/font`** (Space Grotesk + Inter) | Self-hosted, no layout shift, no third-party font request. |
| Images | **Pre-optimized WebP**, `next/image` with `unoptimized: true` | `output: export` can't optimize at runtime; pre-optimizing protects LCP. |
| Lead delivery | **notifygw.com** `POST /api/v1/email` | Chosen provider; no DB, plain-text notification email to the owner. |
| Lead endpoint | **Cloudflare Pages Function** `functions/api/lead.ts` | Static export has no runtime route handlers; Pages Functions fill the gap. |
| Blog | **Deferred** (future: TinaCMS git-backed MDX) | Owner wants MDX-on-GitHub only, no added infra now. |
| AI posts | **Deferred** (future: GitHub Actions + Claude) | Depends on the blog; out of scope this phase. |

---

## 4. Design system (ported from Design 5)

**Palette** (Tailwind theme tokens — names preserved so the mockup's classes port directly):

| Token | Hex | Use |
|---|---|---|
| `bone` | `#F0EBE0` | Page background |
| `plaster` | `#F7F3EA` | Alt surface / cards |
| `navy` | `#1B3A5B` | Primary brand, dark sections |
| `navyd` | `#132C46` | Navy hover |
| `ochre` | `#D98A2B` | Accent / CTA background |
| `ochred` | `#C47C1E` | CTA hover (≥4.5:1 with ink text) |
| `ochrelt` | `#EAA64D` | Ochre accent **text** on dark |
| `clay` | `#9C5510` | Ochre-family **text** on light |
| `ink` | `#20201C` | Body text |
| `sage` | `#5E664B` | Small text on bone |

- **Fonts:** `display` = Space Grotesk (headings, eyebrows); `sans` = Inter (body).
- **Shadow:** `tile` = `0 18px 40px -20px rgba(19,44,70,0.55)`.
- **Signature motif:** hexagon tessellation (repeating inline SVG background), solid hex "chips"
  (CSS `clip-path` polygon), and hex-masked gallery hover — all ported verbatim.
- **Motion system:** scroll-reveal via a single IntersectionObserver, hero float, CTA shine,
  hover lifts — **all gated behind `prefers-reduced-motion` and a JS-ready flag**; no-JS and
  reduced-motion users get static, fully-visible content. Preserve this exactly.
- **Accessibility:** visible focus rings, skip link, 44px+ touch targets, `aria-live` form
  errors, keyboard-navigable lightbox with focus trap — all carried over from the mockup.

---

## 5. Architecture & file structure

```
app/
  layout.tsx            # <html>, fonts, global CSS, base metadata, viewport, theme-color
  page.tsx              # landing page — composes marketing components
  sitemap.ts            # static sitemap (home; extensible for future blog)
  robots.ts             # robots directives + sitemap link
  manifest.ts           # PWA manifest (ported from site.webmanifest)
  globals.css           # Tailwind layers + hex-motif CSS + motion system + reduced-motion rules

components/
  marketing/
    Header.tsx           # sticky header + wordmark + nav + CTA (client: none needed)
    Hero.tsx             # asymmetric color-block hero + hex seam chip
    TrustBar.tsx
    Services.tsx         # 8-card services grid
    WhyUs.tsx            # 6-cell navy differentiators block
    Process.tsx          # 4-step how-it-works
    Gallery.tsx          # masonry grid (client: opens Lightbox)
    Lightbox.tsx         # accessible modal (client: focus trap, Esc, arrow nav)
    Testimonials.tsx     # 3 PLACEHOLDER reviews (clearly labeled; see §8)
    EstimateForm.tsx     # client: inline validation, honeypot, submit → /api/lead
    ServiceArea.tsx      # city chips
    Footer.tsx
    MobileActionBar.tsx  # sticky call / estimate bar (mobile)
    Reveal.tsx           # client wrapper: scroll-reveal IntersectionObserver
  seo/
    JsonLd.tsx           # renders <script type="application/ld+json"> from a JS object

lib/
  seo.ts                # metadata builders + JSON-LD object factories
  business.ts           # single source of truth: NAP, hours, service area, services

functions/
  api/
    lead.ts             # Cloudflare Pages Function: validate + call notifygw.com

public/
  images/               # pre-optimized WebP project photos (from assets/img)
  logo-tf.svg, favicon.*, apple-touch-icon.png, web-app-manifest-*.png, og-image.*

next.config.mjs         # output: 'export', images.unoptimized: true
tailwind.config.ts      # (or CSS @theme) — palette, fonts, shadow tokens
package.json
.env.local.example      # NOTIFYGW_API_KEY, NOTIFYGW_INSTANCE, LEAD_TO_EMAIL, etc.
```

**Client vs server components:** everything is a Server Component by default. Only `Lightbox`,
`Gallery` (click handling), `EstimateForm`, `Reveal`, and `MobileActionBar` (if it needs JS) are
Client Components. Keep the client bundle minimal to protect CWV.

---

## 6. Content & data

- **`lib/business.ts`** holds all business facts (name, phone `+16892557378`, email
  `roberto.topflooring@gmail.com`, address, hours `Mo-Su 06:30-21:00`, service-area cities,
  service list). Components and JSON-LD read from here — one source of truth, no duplication.
- **Copy** is transcribed from `CONTENT.md` / the mockup into the components. No new copy this
  phase. If future net-new page copy is needed, use the marketing copywriting skill.

---

## 7. SEO stack

1. **Metadata** (`app/layout.tsx` base + page-level): title
   `Top Flooring Services | Flooring Installation in Orlando, FL`, meta description from
   CONTENT.md, canonical URL, OpenGraph (title/description/type/image), Twitter card,
   `theme-color #1B3A5B`. Use Next's Metadata API.
2. **JSON-LD** (`components/seo/JsonLd.tsx` + `lib/seo.ts`): `HomeAndConstructionBusiness` with
   name, image, telephone, email, `PostalAddress`, `areaServed`, `openingHours`, `priceRange`,
   and `sameAs`/geo where available — built from `lib/business.ts`.
3. **`app/sitemap.ts`** — emits the home URL now; structured so blog URLs slot in later.
4. **`app/robots.ts`** — allow all, reference the sitemap.
5. **`app/manifest.ts`** — port `site.webmanifest` (icons, theme color, name).
6. **OG image** — provide a dedicated 1200×630 `og-image` (hero-derived) rather than reusing a
   large content photo.
7. **CWV guardrails** — `next/font`, pre-optimized WebP, `fetchpriority="high"` on the hero
   image, lazy-load below-the-fold images, minimal client JS.

---

## 8. Lead form + notifygw.com

**Flow:** `EstimateForm` (client) collects `name*, phone*, email*, service*, details` →
client-side validation (mirrors the mockup: required checks, phone ≥7 digits, email regex,
`aria-live` errors) → on submit, POST JSON to **`/api/lead`** → on `202` swap to the existing
"Thank you" success state; on error show an inline retry message.

**`functions/api/lead.ts` (Cloudflare Pages Function):**
- Accept `POST` JSON only; reject other methods.
- **Anti-spam:** honeypot field (hidden input that must stay empty) + a light per-IP rate limit
  (e.g., via Cloudflare KV or an in-memory/edge check — simplest acceptable form; may start with
  honeypot + basic checks and add KV rate-limit only if abused).
- Server-side re-validate all fields.
- Call notifygw:
  ```
  POST https://api.notifygw.com/api/v1/email
  Authorization: Bearer ${NOTIFYGW_API_KEY}      # ngw_... key
  Content-Type: application/json
  {
    "to":      "${LEAD_TO_EMAIL}",               # roberto.topflooring@gmail.com
    "subject": "New estimate request — <name> (<service>)",
    "message": "<plain-text formatted lead: name, phone, email, service, details, timestamp>",
    "instance": "${NOTIFYGW_INSTANCE}"           # optional; only if >1 email instance
  }
  ```
- notifygw returns `202 Accepted` + `outbox_id`. Treat non-2xx as failure; return a JSON error
  to the client without leaking provider details. Do **not** put the API key in any client code.
- `message` is plain text (provider constraint) — format the lead as readable lines. Set the
  lead's email into the body (and, if the provider later supports it, reply-to).

**Secrets** (Cloudflare Pages env vars, never committed): `NOTIFYGW_API_KEY`,
`NOTIFYGW_INSTANCE` (optional), `LEAD_TO_EMAIL`.

**Testimonials note:** the 3 testimonials in the mockup are **illustrative placeholders** and
are labeled as such. They must NOT be presented as real customer quotes. Keep the visible
disclaimer ("Reviews shown are illustrative samples pending verified Google reviews") until real
Google reviews replace them.

---

## 9. Assets migration

- Copy `assets/img/*` → `public/images/`, converting JP/PNG to **WebP** and resizing to sane max
  widths (several originals are 300–480 KB; target well under that for LCP). Keep filenames
  stable where the mockup references them.
- Copy favicons, `apple-touch-icon.png`, `web-app-manifest-*.png`, `logo-tf.svg` → `public/`.
- Create a purpose-built `og-image` (1200×630).
- Preserve `alt` text from the mockup (it is descriptive and SEO-relevant).

---

## 10. Deployment

- **Build:** `next build` with `output: 'export'` → static `out/`.
- **Cloudflare Pages:** connect the repo; build command `next build`, output dir `out`;
  `functions/` deploys automatically as Pages Functions. Set env vars in the Pages dashboard.
- **Flow:** `git push` to the production branch → Pages builds → deploys. Preview deployments on
  PRs/branches for review.
- **Local dev:** `next dev` for the site; test the Pages Function via `wrangler pages dev out`
  (or the Pages local emulator) so `/api/lead` runs against notifygw with a test key.

---

## 11. Testing & verification

- **Unit:** `lib/seo.ts` (metadata + JSON-LD object shape) and the lead-function validation
  (valid/invalid payloads, honeypot trip, provider-error handling with a mocked fetch).
- **E2E (Playwright):** landing page loads; form required-field validation; successful submit
  path (provider mocked) reaches the thank-you state; lightbox opens and is keyboard-navigable
  (Esc/arrows/focus trap); reduced-motion renders static content.
- **Manual/verify:** run the real form once against a notifygw test key and confirm the email
  lands; Lighthouse pass on mobile (performance/SEO/accessibility); validate JSON-LD in Google's
  Rich Results test; verify sitemap/robots/manifest resolve.

---

## 12. Future phases (documented, NOT built now)

- **Phase 2 — Blog (TinaCMS, git-backed MDX):** posts as MDX files in `content/blog/`, rendered
  by Next; `tina/config.ts` schema for editing. Kept dependency-light per owner preference
  (evaluate purely-file MDX vs. Tina Cloud when the phase starts). `sitemap.ts` and the SEO
  helpers are already structured to extend to blog URLs and `BlogPosting`/`BreadcrumbList` JSON-LD.
- **Phase 3 — Daily AI posts:** GitHub Actions scheduled workflow runs Claude to draft an MDX
  post from the content pillars / SEO keyword list → commits to the repo → Cloudflare Pages
  rebuilds. No extra runtime infrastructure.

---

## 13. Assumptions & open items

- A notifygw.com API key (`ngw_...`) and at least one registered email instance exist (or will be
  created) before the lead form ships. If more than one instance is registered, `NOTIFYGW_INSTANCE`
  must be set.
- Production domain is TBD; canonical/OG URLs use an env-configured `SITE_URL` so the domain can
  be set at deploy time without code changes.
- Real Google reviews to replace placeholder testimonials are not yet available; disclaimer stays.
- Tailwind major version (v3 config vs v4 `@theme`) to be finalized in the implementation plan;
  either can carry the palette/token names above.
