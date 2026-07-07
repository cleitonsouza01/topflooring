# Top Flooring Services — Website

Marketing site for **Top Flooring Services LLC** (Orlando, FL). Next.js (App Router) built as a
**fully static export** and deployed to **Cloudflare Pages**, with one Cloudflare Pages Function
for the estimate-request lead form.

Design: a production port of "Design 5 — Tile Motif". Full design spec:
[`docs/superpowers/specs/2026-07-06-topflooring-landing-page-design.md`](docs/superpowers/specs/2026-07-06-topflooring-landing-page-design.md).

## Stack

- **Next.js 16** App Router, `output: 'export'` (static)
- **React 19**, **TypeScript**, **Tailwind CSS 3**
- **Vitest** for unit tests
- **Cloudflare Pages** hosting + **Pages Functions** (`functions/api/lead.ts`)
- Lead email delivery via **notifygw.com**

## Local development

```bash
npm install
npm run dev            # http://localhost:3000
```

Other scripts:

```bash
npm run build          # static export -> out/
npm run typecheck      # tsc --noEmit
npm test               # vitest (SEO builders + lead function contract)
npm run optimize:images  # regenerate public/images WebP from source photos
npm run pages:dev      # serve the built out/ with Functions via wrangler (needs wrangler)
```

To exercise the lead form locally with the Function running, create a `.dev.vars` file
(gitignored) with `NOTIFYGW_API_KEY`, `LEAD_TO_EMAIL`, and optional `NOTIFYGW_INSTANCE`, then
`npm run build && npm run pages:dev`.

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | build | Canonical origin for metadata, canonical URLs, OG, sitemap, robots. |
| `NOTIFYGW_API_KEY` | Pages Function (secret) | notifygw.com API key (`ngw_...`). |
| `NOTIFYGW_INSTANCE` | Pages Function (optional) | Email instance id; only if more than one is registered. |
| `LEAD_TO_EMAIL` | Pages Function (secret) | Inbox that receives estimate requests. |

See `.env.local.example`.

## Deploy (Cloudflare Pages)

1. Push this repo to GitHub and connect it in the Cloudflare Pages dashboard.
2. Build command: `npm run build` · Output directory: `out`.
3. Set the environment variables above (Settings → Environment variables). Mark the
   notifygw/lead vars as **secrets** and set them for Production (and Preview if desired).
4. `functions/` deploys automatically as Pages Functions, exposing `POST /api/lead`.

Publishing = `git push` → Pages builds and deploys. Content changes are code changes (this site
is static by design).

## Images

Source photos are converted to optimized WebP in `public/images/` by
`scripts/optimize-images.mjs`. Point it at a source directory with `SRC=/path/to/img` and rerun
`npm run optimize:images` to regenerate. A 1200×630 `public/og-image.jpg` is derived from the hero.

## Project structure

```
app/            layout, page, sitemap/robots/manifest, globals.css
components/
  marketing/    header, hero, sections, gallery + lightbox, estimate form, footer, ...
  seo/          JsonLd
lib/            business.ts (single source of truth), seo.ts (metadata + JSON-LD)
functions/api/  lead.ts (Cloudflare Pages Function)
public/         favicons, manifest icons, logo, images/*.webp, og-image.jpg
tests/          seo + lead unit tests
scripts/        optimize-images.mjs
```

## Notes

- **Testimonials are placeholders.** The disclaimer must remain until replaced with verified
  Google reviews (see `lib/business.ts`).
- **Deferred phases** (documented in the spec, not built): a git-backed MDX blog (TinaCMS) and a
  daily AI post pipeline (GitHub Actions + Claude).
