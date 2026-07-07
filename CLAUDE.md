# Top Flooring Orlando

Static marketing site for a flooring-installation business in Orlando, FL. Single-page
lead-gen site (`app/page.tsx`) whose only dynamic surface is an estimate form that emails
the owner. No database, no auth, no user state.

## Tech stack

- **Next.js 16** (App Router) with `output: 'export'` → fully static, **no Node server at runtime**. Turbopack builds.
- **React 19**, **TypeScript 6** (strict).
- **Tailwind CSS 3.4** + PostCSS + Autoprefixer. Theme tokens (`navy`, `ochre`, `clay`, `bone`, `ink`) in `tailwind.config.ts`; global CSS in `app/globals.css`.
- **Cloudflare Pages** hosting (git-connected, builds from `main`), **Cloudflare Pages Functions** for the one backend endpoint.
- **Wrangler 4** for local Functions + secrets.
- **notifygw.com** transactional email API (lead delivery).
- **Cloudflare Turnstile** anti-spam on the estimate form.
- **Vitest 4** (node env) for tests; Playwright / chrome-devtools MCP for browser E2E.
- **sharp** for build-time image optimization. Node 20 (`.nvmrc`).

## Layout

- `app/` — the App Router site (`page.tsx`, `layout.tsx`) + generated `sitemap.ts` / `robots.ts` / `manifest.ts`.
- `components/marketing/` — UI, incl. `EstimateForm.tsx` (the lead form).
- `functions/api/lead.ts` — the **only** backend: validates the estimate submission and fans it out to notifygw. Anti-spam layers: honeypot, time-trap, Turnstile (all fail-open).
- `lib/business.ts` — business facts (name, phone, service list). `lib/seo.ts` — SEO/schema helpers.
- `tests/` — `lead.test.ts` (Function), `seo.test.ts`.
- `scripts/optimize-images.mjs` — pre-optimizes images to WebP (static export can't use Next's Image Optimization API; `images.unoptimized: true`).

## Commands

- `npm test` (vitest run) · `npm run typecheck` (`tsc --noEmit`).
- `npm run build` then `npm run pages:dev` — serve the built site **with** the Function locally via `wrangler pages dev out`. Plain `next dev` does **not** run `functions/`, so `/api/lead` 404s there.
- `npm run lint` is **broken** under Next 16 (`next lint` mis-parses its arg) — don't rely on it; use `tsc` + tests.

## Environment variables — two surfaces, do not mix (this has caused real bugs)

| Var | Surface | Read where | Local | Production |
|---|---|---|---|---|
| `NEXT_PUBLIC_*` (e.g. `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`) | **Build-time**, inlined into the client bundle | Next during `build` | `.env` | Cloudflare Pages → Settings → Environment variables (Production). **Must exist before the build** or it won't be inlined. `.env` is gitignored and never reaches CF. |
| Function secrets (`NOTIFYGW_API_KEY`, `NOTIFYGW_INSTANCE`, `LEAD_TO_EMAIL`, `TURNSTILE_SECRET_KEY`) | **Request-time**, server-only | `functions/api/lead.ts` via `env` | `.dev.vars` | Cloudflare Pages env vars / Function secrets |

A `NEXT_PUBLIC_` var without that exact prefix won't reach the client; a Function secret put in `.env` is never read by the Function. Match the surface.

## Deploy

Git-connected: push to `main` → Cloudflare builds and deploys. Set/mirror any new env vars in the CF dashboard **before** the build that needs them. Confirm before pushing (outward-facing/live).
