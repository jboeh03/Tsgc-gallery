# Leads Radar — design spec (v1)

A compliant "intent listener" for Tri-State Grill Cleaning. It does **not** scrape
contact info or auto-send messages. It helps Jeff respond — fast and personally — to
people who have *publicly* raised their hand asking for grill cleaning, and logs each
touch so the CRM stays honest.

Status: **spec only — no feature code written yet.** This document is the thing to
review before building.

---

## 1. Why it's shaped this way (the constraints are the design)

| Platform | Programmatic access? | What Radar does |
|----------|----------------------|-----------------|
| **Nextdoor** | None. No public API, hard anti-bot. | **Assist lane** — Jeff pastes a public post he found (or got via Nextdoor's own keyword notifications); Radar drafts a reply + logs it. |
| **Facebook Groups** | None. Groups API removed in 2024. | **Assist lane** — same paste-in flow. |
| **Reddit** | Yes — official public API, ToS-clean. | **Auto lane (optional, phase 2)** — poll for intent phrases in local + grilling subs. |
| **Public web** | Yes — Google Alerts → RSS. | **Auto lane (optional, phase 2)** — surface public mentions. |

**Non-negotiable boundaries** (these are what keep Jeff out of TCPA / ToS trouble):

- Radar never stores or displays a person's phone/email harvested from a platform.
- Radar never sends anything. It produces *draft text Jeff copies* and posts himself,
  on-platform, as a reply to a public post.
- The only outbound channel for a prospect remains **the quote form / Jeff's text line**,
  reached because the prospect chose to click — never an unsolicited push.

If a future change would cross any of these, it's a product decision, not a tweak.

---

## 2. v1 scope = the Assist lane only

Phase 2 (Reddit/web auto-poll) is specced in §7 but **not** part of v1.

### User flow
1. Jeff spots a public "anyone know a grill cleaner?"-type post on Nextdoor / a local
   FB group.
2. He opens **Admin → Radar**, pastes the post text into a box, optionally tags the
   source (Nextdoor / Facebook / other) and the neighborhood.
3. Radar calls Claude and returns a short, personal, non-salesy reply written in Jeff's
   voice that points them to the free quote form or his text line.
4. Jeff edits if he likes, clicks **Copy**, and pastes it as a reply on the platform.
5. Clicking Copy logs a `radar_touch` event to the Sheet (source, neighborhood,
   timestamp, intent score) so the CRM sees the outreach and we can measure what converts.

No prospect identity is stored — just that *a* touch happened, where, and when.

---

## 3. Files to add (all mirror existing patterns)

```
app/admin/(dashboard)/radar/page.tsx     server component shell + <RadarConsole/>
components/admin/RadarConsole.tsx         "use client" — paste box, draft, copy, log
app/api/radar/draft/route.ts             Node runtime; calls draftReply(); Auth.js-gated
lib/radar/draft.ts                       Claude call + system prompt (mirrors lib/preview/claude.ts)
lib/radar/keywords.ts                    intent phrases + scoreIntent(text) → 0..3
lib/radar/types.ts                       RadarSource, DraftRequest, DraftResult
docs/leads-radar.md                      this file
```

Files to edit:
- `components/admin/Sidebar.tsx` — add `{ href: "/admin/radar", label: "Radar", icon: "radar" }`
  to `NAV` and a `radar` case in `NavIcon` (a radar/antenna glyph).
- `lib/admin/events.ts` — add a `logRadarTouch()` sibling to `logAffiliateClick()`
  (same fire-and-forget shape, `kind: "radar_touch"`).
- Apps Script (`integrations/*.js`, deployed separately) — branch `kind: "radar_touch"`
  → write to a new **📡 Radar Touches** tab. Until that's deployed, logging no-ops
  gracefully (the POST just lands nowhere), so the UI ships independent of the script.

Nothing here touches the public site or the preview/admin surfaces' existing behavior.

---

## 4. The draft endpoint — `app/api/radar/draft/route.ts`

- **Runtime:** Node (needs the Anthropic SDK), like `app/api/preview/route.ts`.
- **Auth:** gated by `middleware.ts` already covers `/admin/*`, but the API route lives
  under `/api/*`. So the route itself must call `auth()` and 401 unless `isAdmin(email)`.
  (This is the one real security check to get right — an open draft endpoint would be an
  unauthenticated Claude proxy.)
- **Input:** `{ postText: string (<= 2000 chars), source: RadarSource, neighborhood?: string }`.
- **Behavior:** validate → `scoreIntent()` → `draftReply()` → return `{ reply, intentScore }`.
- **Fail-soft:** if `ANTHROPIC_API_KEY` is missing, return a clear 503 + message (mirrors
  how preview hard-fails without the key) rather than throwing at import.

No rate limiter needed in v1 — it's a single authenticated internal user, not public.

---

## 5. The draft prompt — `lib/radar/draft.ts`

Same construction as `lib/preview/claude.ts`: `new Anthropic()`, `claude-haiku-4-5`,
system prompt with `cache_control: ephemeral`, structured `output_config` JSON schema
returning `{ reply, intentScore, rationale }`.

System-prompt rules (these encode the brand + compliance posture — treat as product):

- **Voice:** Jeff — veteran-founded local operator, Cincinnati / NKY / Dayton. Direct,
  warm, zero corporate fluff. First person ("I", "we"), never "Dear customer."
- **Length:** 2–4 sentences. A neighbor-to-neighbor reply, not an ad.
- **Content:** acknowledge their specific situation (reference a detail from their post),
  one line of credibility, one soft CTA. Offer the **free quote form** or **text line** —
  let *them* reach out. Never ask for their number; never imply we'll contact them first.
- **No price quotes** in the reply (the post is text-only; pricing needs the photo flow).
  Point them to the free quote instead.
- **Honest, no spam tells:** no ALL CAPS, no emoji spray, no "ACT NOW," no fake scarcity.
  If the pasted text isn't actually someone seeking grill cleaning, say so and return
  `intentScore: 0` with an empty reply rather than inventing a pitch.
- **Compliance guardrail in the prompt itself:** "You are drafting a reply Jeff will post
  publicly himself. Never write anything that assumes we already have their contact info."

`scoreIntent(text)` in `keywords.ts` is a cheap pre-filter (keyword hits → 0–3) so the UI
can flag low-intent pastes before/after the model call; the model returns its own
`intentScore` as the authoritative value shown.

---

## 6. Data logged (and deliberately not)

`logRadarTouch({ source, neighborhood, intentScore, repliedAt })` → Apps Script →
**📡 Radar Touches** tab:

| timestamp | source | neighborhood | intentScore | (no PII) |
|-----------|--------|--------------|-------------|----------|

What we **don't** log: the prospect's name, handle, phone, email, or the raw post text.
The post text is sent to Claude for drafting and then dropped — not persisted. This keeps
the system free of a harvested-contact database, which is the whole point.

A later admin view could chart touches → quote-form submissions to prove ROI, but that's
out of v1.

---

## 7. Phase 2 (specced, not built) — the Auto lane

Add `lib/radar/sources/reddit.ts`: poll Reddit's public search API for `keywords.ts`
phrases scoped to grilling subs + (best-effort) local subs. Render matches as cards on
the Radar page with a link out and a "draft reply" button feeding the same §4 endpoint.

- Needs `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET`; **degrades to off** if unset (same
  fail-soft contract as Gemini in the preview flow).
- Still Assist-shaped: Radar surfaces the public post and drafts a reply; Jeff posts it
  himself. No auto-reply, even where the API technically allows it.
- Reality check to set expectations: local grill-cleaning intent on Reddit is *thin*.
  This lane is a bonus, not the main vein. Nextdoor/FB (Assist lane) is where the leads
  actually are — which is why v1 is Assist-only.

A Google-Alerts-RSS source is a cheaper alternative to Reddit and could slot in the same
`sources/` shape.

---

## 8. Verification plan (per CLAUDE.md)

- `npm run typecheck` + `npm run lint` clean.
- `/admin/radar` renders, paste→draft returns a sane reply, Copy logs a touch (verify the
  POST fires; the Sheet write depends on the Apps Script branch being deployed).
- Hitting `/api/radar/draft` unauthenticated returns 401.
- With `ANTHROPIC_API_KEY` unset, the page shows a graceful "drafting unavailable" state
  instead of erroring.

---

## 9. Open questions for Jeff before build

1. **Text line:** what number/link should the CTA point to — the quote form only, or a
   specific SMS number too? (Need the canonical value for the prompt.)
2. **Sidebar slot:** Radar between Leads and Jobs, or lower down?
3. **Apps Script:** OK to add the `radar_touch` branch + 📡 tab now, or ship the UI first
   and wire logging later?
