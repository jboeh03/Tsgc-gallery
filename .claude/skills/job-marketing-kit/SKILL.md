---
name: job-marketing-kit
description: Turn finished grill-cleaning job photos into a full marketing kit for Tri-State Grill Cleaning. Use this whenever Jeff dumps before/after photos (into marketing/all-photos-raw/ or pasted into chat) or asks to "make before/afters", "post this job", "what should I do with these photos", or otherwise wants finished-job photos turned into branded assets, website updates, and social posts. Acts as the in-house designer + local marketer.
---

# Job Marketing Kit

When Jeff shares photos from a completed job, your job is to act as his **designer and
local marketer**: produce branded before/after assets, fold the job into the website,
and draft ready-to-post social content — all on-brand and in his voice.

Work through the pipeline below. Always **show your output and confirm before publishing
anything outward-facing** (posting, pushing live). Generating files and editing local
data is fine to do directly.

## Brand system (the non-negotiables)

- **Colors** (mirror `tailwind.config.ts`): navy `#1A3055`, burgundy `#8B1F2F`, bone
  `#F7F3EE`, ink `#3D3D3A`. Display font: **Oswald** (`marketing/fonts/Oswald.ttf`),
  body: Inter/Arial.
- **NAP / contact** (from `lib/site.ts`): Tri-State Grill Cleaning · veteran-founded ·
  Cincinnati, NKY, Dayton · phone `(657) 831-4276` · `tristategrillcleaning.com`.
- **Privacy rule:** never publish a customer's exact address or name. Location = the
  **neighborhood** only (e.g. "Hyde Park, Cincinnati"). This holds for composites,
  captions, and the map.
- **Voice:** Jeff, first person. Veteran-founded, plain-spoken, no corporate fluff,
  no hype. See the voice guide at the bottom and `marketing/memorial-day-facebook-post.txt`
  for the reference tone.

## Pipeline

### 1. Intake & pair the photos
- Photos may arrive in `marketing/all-photos-raw/` or pasted in chat. Identify
  **before/after pairs** (same grill, same angle). If pairing is ambiguous, ask.
- Gather the job facts you'll need (ask Jeff for whatever isn't obvious from the photos):
  **neighborhood**, **grill model**, **grill type** (gas/charcoal/pellet/built-in),
  **service hours**, **date**. Detect the brand only if a logo/badge is visible — don't
  guess (same conservatism as the `/preview` Claude prompt).

### 2. Add the job to gallery data
- Convert/copy the chosen photos into `public/gallery/` as `tsg-XXX-before.webp` and
  `tsg-XXX-after.webp` (next free `tsg-XXX` id; use webp, they stay small).
- Add a `Job` entry to `data/jobs.json` matching the existing schema
  (`lib/types.ts`): `id, neighborhood, date, grillType, grillModel, serviceHours,
  pairs[{before, after, beforeAlt, afterAlt}], featured`. Write **descriptive alt text**
  in the established style (see existing entries — specific about what's visible: buildup,
  grates, heat shields, cookbox).

### 3. Generate branded composites
- Run: `python3 marketing/generate-composites.py` → writes to `marketing/composites/`.
- Outputs per job: **`-square.jpg`** (1080², the hero — IG/FB feed) and
  **`-landscape.jpg`** (2000×1050 — link posts, website headers).
- Two footer modes in the generator: **`meta`** (location/model/service — proof-led,
  default) and **`message`** (a `(kicker, (headline, subline))` — pitch-led, e.g.
  "We clean what others won't"). Use message mode when the photos are dramatic and you
  want the card to sell the service, not just document it.
- **Cover-fit** crops slightly to fill — eyeball each card and flag any where a tall lid
  or legs clip badly; re-shoot framing or fall back to a different pair if so.

### 4. Identify other use cases for the photos
Run this checklist for every strong job and recommend the ones that fit:
- **Gallery** — set `featured: true` for the best one or two (it drives the hero).
- **This-week map** — if this job's neighborhood is on the current `data/schedule.json`
  week, add its `jobId` so the map pin flips to a clickable before/after.
- **Google Business Profile** — a GBP photo post (square works); strongest local-SEO lever.
- **Review request** — *paused.* Don't recommend review asks right now (see
  `SHOW_REVIEWS` in `lib/site.ts`).
- **Email / newsletter** — a fresh before/after for any active campaign.
- **Ads / flyer** — the message-mode card doubles as ad creative.
- **OG share image** — if a page needs a richer share card, a landscape composite works.

### 5. Decide website placement
- Default: the job lands in the **gallery** (step 2 does this). Decide `featured`.
- If it's a standout (extreme buildup, premium/built-in grill, great framing), recommend
  promoting it — featured hero, and/or the this-week map link.
- Keep edits **config-as-data**: change `data/jobs.json` / `data/schedule.json`, never
  hand-edit the rendering pages.

### 6. Draft social posts
For each job worth posting, draft a short kit (save to `marketing/<id>-social.txt`):
- **Facebook** (primary): 2–4 sentences in Jeff's voice — what the grill was, what you
  did, a soft CTA to the quote form or text line. Pair with the **square** composite.
- **Instagram**: trimmed version; note "link in bio + first comment" (IG captions aren't
  clickable).
- **Nextdoor**: neighbor-to-neighbor angle, posted in that job's neighborhood + adjacent
  ones. (Ties into the compliant "reply where they ask" posture — never mass-DM.)
- **Posting notes**: FB throttles external links → post the body natively, drop the link
  in the **first comment**. Best window: Tue/Wed 10am–12pm local. Pin standout posts.

### 7. Present the kit
Summarize for Jeff: composites generated (with the images shown), the jobs.json/gallery
change, recommended placements, and the drafted posts — then ask what to publish.

## File map
- `marketing/generate-composites.py` — the branded composite generator (square + landscape,
  meta + message footer). Edit here to change the template.
- `marketing/composites/` — generated assets (gitignore-able; regenerable any time).
- `marketing/fonts/Oswald.ttf` — brand display font (Oswald variable, OFL).
- `data/jobs.json` + `public/gallery/` — the gallery source of truth.
- `data/schedule.json` + `lib/areas.ts` — the this-week map (link finished jobs via `jobId`).
- `lib/site.ts` — canonical NAP/contact. `marketing/memorial-day-facebook-post.txt` — voice ref.

## Voice guide (quick reference)
- First person, as Jeff. Veteran-founded; mention it when it fits, don't lean on it.
- Concrete over salesy: name the grill, name what you cleaned, show the result.
- Soft CTA: "Free quote → tristategrillcleaning.com" or "Call/text me: (657) 831-4276".
  Never promise a specific response or turnaround time.
- Sign-off: `Veteran-founded · Cincinnati · NKY · Dayton`. Hashtags sparingly:
  `#VeteranFounded #CincyGrillCleaning #GrillSeason`.
- Never: fake urgency, ALL-CAPS hype, emoji spray, stock-photo clichés, customer addresses.
