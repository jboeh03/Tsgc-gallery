# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working guidelines

- **Think before coding.** State assumptions explicitly; if uncertain or multiple interpretations exist, ask rather than pick silently. Surface a simpler approach when one exists.
- **Simplicity first.** Write the minimum code that solves the problem — no speculative features, abstractions for single-use code, or error handling for impossible cases.
- **Surgical changes.** Touch only what the task requires. Match existing style, don't refactor or reformat adjacent code, and only remove orphans your own change created. Flag pre-existing dead code instead of deleting it.
- **Goal-driven execution.** Turn the task into a verifiable success criterion and loop until it's met (e.g. `npm run typecheck` + `npm run lint` clean, the page behaves as intended in the browser).

## Commands

```bash
npm install
npm run dev          # next dev — http://localhost:3000
npm run build        # production build
npm run start        # serve the production build
npm run lint         # next lint (eslint-config-next)
npm run typecheck    # tsc --noEmit (strict mode)
```

There is no test suite. Verify changes with `npm run typecheck` + `npm run lint`, and exercise the affected page in the browser. Many features depend on env vars and external services (Anthropic, Gemini, Google Sheets, Auth.js) that only fully work in deployed/preview environments — locally they degrade gracefully (see below).

## Stack

Next.js 14 (App Router) · TypeScript (strict) · Tailwind CSS · React 18. Path alias `@/*` maps to the repo root (`@/lib/site`, `@/components/Nav`, etc.). Deployed on Vercel.

## Architecture

The repo is one Next.js app serving three distinct surfaces, separated by route groups and gated by `middleware.ts`:

1. **Public marketing site** — `app/(site)/*` (gallery, products, quote, services, about, memorial-day). Wrapped by `app/(site)/layout.tsx` (Nav + Footer + PromoBanner). Always public.
2. **AI grill preview** — `/preview` page + `/api/preview` route. Hidden on production custom domains, visible on `*.vercel.app` for testing.
3. **Admin dashboard** — `app/admin/(dashboard)/*`. Auth-gated by a Google email allowlist.

`middleware.ts` is the single chokepoint enforcing surfaces 2 and 3: it 404s `/preview` + `/api/preview` on `SITE.publicHosts`, and redirects `/admin/*` (except `/admin/sign-in`) to sign-in unless `req.auth.user.email` passes `isAdmin()`. The host check is mirrored client-side by `lib/preview-flag.ts` (`isPreviewVisible()`) so the Nav link is hidden too.

### Config-as-data (`lib/`)

Several "config" files are the source of truth for content and behavior — edit these rather than the pages that render them:

- `lib/site.ts` — `SITE`: business constants (phone, email, social, `canonicalUrl`, `publicHosts`, and `quoteEndpoint`, the Apps Script URL the quote form POSTs to). Read everywhere.
- `lib/campaign.ts` — `CAMPAIGN`: the Memorial Day promo (tiers, codes, `endISO`). `isCampaignActive()` auto-hides the banner and flips the landing page to "ended" past the deadline — no deploy needed.
- `lib/products.ts` — `PRODUCTS` / `CATEGORIES`: the affiliate catalog. Amazon tag (`tarchlabs-20`) and the GPR ref are baked in here; never change the affiliate IDs without updating both programs.
- `lib/types.ts` — `Job` / `Pair` shared types for the gallery.

### Gallery data pipeline

`lib/jobs.ts` `getJobs()` is the single entry point. It reads bundled `data/jobs.json` by default; if `NEXT_PUBLIC_JOBS_SOURCE=sheet` and `NEXT_PUBLIC_JOBS_SHEET_CSV_URL` are set it fetches a published Google Sheet CSV (parsed by the in-file RFC-4180-ish parser), falling back to JSON on any error. Gallery images live in `public/gallery/` as `tsg-XXX-before`/`-after`; swapping a photo = drop the file + update the path in `jobs.json`.

### AI preview flow (`lib/preview/`, `app/api/preview/route.ts`)

`POST /api/preview` (Node runtime, `maxDuration=60`) validates the upload (mime allowlist, 5 MB cap, email, consent), rate-limits per IP (3/day) and email (1/day) via an **in-memory** limiter (`rateLimit.ts` — resets when the serverless fn recycles, not abuse-proof), then:
1. `analyzeGrillPhoto()` (`claude.ts`) — Claude vision (`claude-haiku-4-5`) returns a structured `Assessment` via `output_config` JSON schema. The long inspection/pricing system prompt is cached (`cache_control: ephemeral`). Requires `ANTHROPIC_API_KEY`; hard-fails the request if missing.
2. In parallel: `generateCleanedGrill()` (`gemini.ts`) — image-to-image "after" render. Returns `null` if `GEMINI_API_KEY` is unset, so the feature degrades to assessment-only. And `captureLead()` (`lead.ts`).

Both AI calls are wrapped in `withTimeout()`. The pricing tiers, severity rules, and brand-detection conservatism in the Claude system prompt encode real business rules — treat changes there as product decisions, not just prompt tweaks.

### Admin dashboard (`app/admin/`, `lib/admin/`)

Auth is **Auth.js v5** (`auth.ts`): Google OAuth, JWT sessions (no DB), access restricted to the comma-separated `ADMIN_EMAILS` allowlist via `isAdmin()` — enforced both in the `signIn` callback and in `middleware.ts`.

Data is **read-only from Google Sheets** via `lib/admin/sheets.ts` using a server-side API key (`GOOGLE_SHEETS_API_KEY` + `GOOGLE_SHEET_ID`). Reads are wrapped in `unstable_cache` (60s revalidate, tagged). Column lookups are by header name (case-insensitive, with aliases) via `pick()`, so column reordering in the sheet is safe. Dashboard pages are async server components that fetch + aggregate, then hand series to client Recharts components in `components/admin/charts/`. Pages handle the "Sheets not configured / unreadable" states explicitly via `checkSheetHealth()` + `EmptyState`.

### Lead & event flow → Apps Script

The website never writes to Sheets directly. The quote form POSTs to `SITE.quoteEndpoint` (a Google Apps Script web app), which writes the lead, links the CRM tab, and emails Jeff. Affiliate clicks go through `/api/track/click?id=<product-id>` → fire-and-forget `logAffiliateClick()` (`lib/admin/events.ts`) → Apps Script (`kind: "affiliate_click"`) → then 302 to the affiliate URL. Logging is best-effort and never blocks the redirect.

### Lead qualifying (`lib/leads/`)

Every new lead — website form, AI preview, or iMessage confirmed booking — is scored 0-100 at intake on four weighted dimensions: proximity (ZIP tier, 30 pts), value tier (grill description / agreed price, 30 pts), customer type (returning vs new, 15 pts), completeness (filled fields, 25 pts). `lib/leads/qualify.ts` is the TypeScript source of truth; `qualifyLead_()` in `integrations/apps-script-endpoint.js` is the mirror used for direct website-form posts. **Keep both in sync** when changing weights or ZIP tiers — there's no compile-time link. The /admin/leads dashboard shows tier badges (HOT/WARM/COOL/COLD), can sort by score, and re-scores older rows on the fly via `qualifyLeadSync()`. See `docs/lead-qualifying.md`.

### Integrations are deployed separately

`integrations/*.js` are **Google Apps Script** sources (not bundled with the Next.js app). They are checked in for version control; deploying = pasting into script.google.com and cutting a new deployment version. If the web-app URL changes, update `SITE.quoteEndpoint`. See `integrations/README.md` and `docs/admin-dashboard.md` for the full data-flow diagram, sheet schemas, and setup/troubleshooting.

## Conventions

- **Server vs client components**: default to server components (data fetching, `headers()`, `auth()`). Reach for `"use client"` only for interactivity — the gallery's canvas scrub/lid animations and the admin charts. Gallery animations are CSS-only (no Framer Motion) and respect `prefers-reduced-motion`.
- **Styling**: Tailwind with brand tokens defined in `tailwind.config.ts` — use the named colors (`navy`, `burgundy`, `bone`, `ink`, `muted`, `border`) and fonts (`font-sans` = Inter, `font-display` = Oswald) rather than raw hex/`#`. Custom keyframes live in `app/globals.css`.
- **Env vars**: see `.env.example`. Features fail soft when keys are absent (Gemini skips, preview 500s without Anthropic key, admin shows an empty state) — preserve that behavior rather than throwing at import time.

## Environment notes

Env vars are set on Vercel (Production + Preview). `next-env.d.ts`, `.next/`, and `.env*.local` are gitignored. The canonical domain is `tristategrillcleaning.com`; `*.vercel.app` previews additionally expose the `/preview` tool.
