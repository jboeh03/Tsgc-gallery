# Tri-State Grill Cleaning — Gallery

Interactive gallery for Tri-State Grill Cleaning (Cincinnati / NKY / Dayton).
Built with Next.js 14 (App Router) + TypeScript + Tailwind CSS.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
npm run typecheck    # tsc --noEmit
```

The gallery lives at `/gallery`.

## What's on the page

1. **Lid Lift hero** — a CSS-built grill (no images, just layered divs) whose
   lid hinges open on tap/click to cross-fade from the featured job's *before*
   photo to its *after* photo. Steam puffs on open. Respects
   `prefers-reduced-motion`.
2. **Burner-knob filter** — five round knobs (All / Gas / Charcoal / Pellet /
   Built-in) that rotate to "on" when active, with arrow-key navigation and
   full radiogroup ARIA semantics.
3. **Scrub-to-reveal grid** — nine cards. Drag (mouse) or scrub (touch) to
   wipe the *before* image off and expose the *after* below via canvas
   `destination-out` compositing. Hits 60% revealed → auto-finishes the wipe.
   Long-press / double-tap / "Reveal" button / range slider available as
   fallbacks for touch, keyboard, screen-reader, and reduced-motion users.

## Data

Jobs live in [`data/jobs.json`](./data/jobs.json). The gallery reads them via
[`lib/jobs.ts`](./lib/jobs.ts) `getJobs()`. The same file contains
`getJobsFromSheet(csvUrl)` plus a tiny CSV parser, ready for when Jeff wants
to manage jobs in Google Sheets.

### Swap to Google Sheets

1. In Google Sheets: `File → Share → Publish to web → CSV`. Copy the URL.
2. Set two env vars (e.g. in `.env.local` or your host's env settings):

   ```
   NEXT_PUBLIC_JOBS_SOURCE=sheet
   NEXT_PUBLIC_JOBS_SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/.../pub?output=csv
   ```

3. Column headers must match the JSON keys: `id, neighborhood, date,
   grillType, grillModel, serviceHours, beforeImage, afterImage, beforeAlt,
   afterAlt, featured, notes` (plus optional `slug`).
4. Redeploy. JSON stays as the fallback if the sheet fetch ever fails.

### Replace placeholder photos

Each job in `data/jobs.json` has a `beforeImage` and `afterImage` path under
`/public/gallery/`. Drop the new file at that path (any extension), update
the two paths in `jobs.json`, and you're done. No code changes needed.

## Files of interest

```
app/
  layout.tsx                Nav + footer wrapper, global styles
  page.tsx                  Minimal home page
  gallery/page.tsx          Server component: loads jobs, renders gallery
  quote/page.tsx            CTA landing stub
  globals.css               Tailwind + custom keyframes (lid, knob, scrub)
components/
  Nav.tsx                   Sticky header with /gallery link
  Footer.tsx
  gallery/
    GalleryClient.tsx       Client wrapper, filter state, bottom CTA
    LidLiftHero.tsx         Section A
    BurnerKnobFilter.tsx    Section B
    GalleryGrid.tsx         Layout + filter application
    ScrubCard.tsx           Section C card (canvas + all fallbacks)
lib/
  types.ts                  Job, GrillType
  jobs.ts                   getJobs() + getJobsFromSheet() + CSV parser
data/
  jobs.json                 Nine seeded jobs
public/
  gallery/                  Eighteen SVG placeholder images
```

## Decisions worth noting

- **Stack**: the repo was empty when this work started, so the spec's
  "match existing conventions" instruction had no target. Picked Next.js
  App Router + TypeScript + Tailwind because the spec assumed `.tsx`,
  `app/`, and a `NEXT_PUBLIC_*` env var.
- **Animations**: CSS only — no Framer Motion. Keeps the gallery bundle
  under 10 kB of route-specific JS.
- **Placeholders**: 18 SVGs (one before + one after per job) rather than
  JPGs. Tiny on disk, sharp at any size, easy to swap. Filenames keep the
  spec's `tsg-XXX-before` / `-after` pattern so future swaps stay obvious.
- **Reveal threshold**: 60% triggers a 500 ms fade of the remaining
  *before* layer — the "satisfaction payoff" called out in the spec.
- **Reduced-motion**: cards become a horizontal before/after slider; the
  lid hero cross-fades without rotating; knobs flip state without
  spinning.
