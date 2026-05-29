# Lead qualifying

Every new TSGC lead is scored 0-100 at intake so Jeff can prioritize
high-value, in-area callbacks instead of triaging from the top of the
sheet. The score lands in three places:

- The CRM sheet, in dedicated columns (`Score`, `Tier`, `Proximity`,
  `Value Tier`, `Customer Type`, `Completeness`).
- The alert email subject + body (`[HOT 86] New Website Lead: ...`).
- The /admin/leads dashboard, with color-coded tier badges and a
  "highest score first" sort option.

## Scoring formula

Five weighted dimensions. The first four sum to 100; the fifth (intent
signals) adds up to 10 more on top — final score is hard-capped at 100,
so the bonus lifts borderline leads without inflating the existing scale.

| Dimension | Max | What it measures |
| --- | --- | --- |
| **Proximity** | 30 | Distance from the Cincinnati base, by ZIP tier (core / extended / fringe / out-of-area). |
| **Value tier** | 30 | Estimated job dollars from the grill description or quoted/agreed price. |
| **Customer type** | 15 | Returning vs new (phone/email match against the CRM tabs **and** the legacy Squarespace lead intake sheet from the pre-2024 site, set via `LEGACY_LEAD_SHEET_ID`). |
| **Completeness** | 25 | How much info Jeff has to act on (name, phone, email, ZIP, address, grill, services, notes). The "address" credit also fires when a street address is detected in the notes field. |
| **Intent signals** | 10 | Bonus for high-intent context: referral (+5), veteran/`VET` promo (+5), multi-grill description (+3), explicit deadline mentioned (+3). Cap 10. |

## Flags

Independent of the score, the qualifier surfaces flags so the dashboard
can highlight context the raw number misses:

| Flag | Meaning | Score impact |
| --- | --- | --- |
| `likely_spam` | Notes contain SEO/Wikipedia/marketing solicitation phrases, or multiple garbage fields paired with an out-of-area ZIP. | **Forces score → 0 / tier → COLD** |
| `referral` | Customer mentioned being referred (or `referredBy` is filled). | +5 intent |
| `veteran` | Customer mentioned military service OR used a promo code containing "VET". | +5 intent |
| `multi_grill` | 2+ distinct grill brand/type tokens spotted (e.g. "Blackstone + Weber"). | +3 intent |
| `has_deadline` | Customer named a specific date or window ("by June 5", "this weekend"). | +3 intent |
| `address_in_notes` | Street address detected in notes field, even though the form's address slot was empty. | +3 completeness |

Tier cutoffs:

| Score | Tier | What it means |
| --- | --- | --- |
| 75-100 | **HOT** | In-area, premium-tier grill, complete contact info. Call first. |
| 55-74 | **WARM** | Solid lead but missing something — likely a partial form fill or a fringe ZIP. |
| 35-54 | **COOL** | Lower-priority — small grill, far ZIP, or sparse info. |
| 0-34 | **COLD** | Out of area or critically incomplete — consider deprioritizing. |

## Where the scoring runs

There are two implementations of the same algorithm — keep them in sync
when you change weights:

- **TypeScript** (`lib/leads/qualify.ts`) — used by the AI preview lead
  capture and the iMessage ingest webhook. Imports the ZIP map from
  `lib/leads/serviceArea.ts` and the value-tier classifier from
  `lib/leads/valueEstimator.ts`. Reads the CRM sheet for returning-
  customer detection via the existing `GOOGLE_SHEETS_API_KEY`.

- **Apps Script** (`integrations/apps-script-endpoint.js` →
  `qualifyLead_()`) — used by direct website-form posts (the quote
  form POSTs straight to Apps Script, not through Next.js). The ZIP
  map and tier constants are duplicated at the bottom of that file
  because Apps Script can't import from TypeScript.

The data flow per entry point:

| Entry point | Who scores | When |
| --- | --- | --- |
| Website quote form | Apps Script (`qualifyLead_()`) | At the moment the lead is appended to the sheet |
| AI preview tool | Next.js (`lib/preview/lead.ts`) | Inside `captureLead` — passes the score in the Apps Script payload so the sheet row uses the same number |
| iMessage relay | Next.js (`/api/imessage/ingest`) | When Claude classifies a thread as "confirmed" — the score is added to the pending booking notification ("⭐ 82 HOT · core · standard+ · returning · 8/8 fields") |

When the Next.js side has already scored a lead, it sends a
`qualification` field in the payload; Apps Script trusts it instead of
re-running. This avoids drift and keeps customer-lookup logic in one
place per entry point.

## Editing the ZIP map

Open `lib/leads/serviceArea.ts`. Each tier is a `Set<string>` of
5-digit ZIPs. To add a new town, drop the ZIP into the appropriate
set and commit. The fallback heuristic (e.g. "any 45xx ZIP we haven't
explicitly classified counts as 'extended'") keeps scoring sane even
for ZIPs you haven't added yet.

**You must also update the Apps Script copy** (`ZIP_TIERS` near the
bottom of `integrations/apps-script-endpoint.js`) and redeploy the
Apps Script for website-form leads to pick up the change. The
Next.js side picks it up automatically on the next deploy.

## Editing the value-tier rules

Open `lib/leads/valueEstimator.ts`. Each tier has a keyword list
matched against the grill description. The same lists are mirrored
inside `classifyValue_()` in the Apps Script. Pricing thresholds
(`>=499 → premium`, `>=349 → standard_plus`, etc.) live in both
files — change in both if pricing shifts.

The classifier prefers an explicit `agreedPriceUsd` (from iMessage
confirmed bookings) or an `estimatedPriceLow/High` (from the AI
preview) when present, falling back to keyword matching on the grill
description string only when neither is available.

## What the admin dashboard does for old rows

Lead rows written before this release have empty `Score` cells in the
sheet. The /admin/leads page detects this and recomputes the score
on the fly using `qualifyLeadSync()` — same algorithm, but the
returning-customer dimension defaults to "unknown" (it would be too
expensive to fan out a sheet lookup per row on every dashboard load).

You'll see a small `·` next to recomputed scores so you can tell them
apart from sheet-stored ones. To backfill real scores on old rows,
re-save them through Apps Script or manually paste in values.

## Tweaking the algorithm

The weights are at the top of `lib/leads/qualify.ts`:

```ts
const PROXIMITY_MAX = 30;
const VALUE_MAX = 30;
const CUSTOMER_MAX = 15;
const COMPLETENESS_MAX = 25;
```

And the tier cutoffs are right below them. If you change a max,
also change the matching `QUAL_*_POINTS` constants in
`apps-script-endpoint.js` and redeploy the Apps Script. The TypeScript
typecheck won't catch a mismatch — keep them in sync by convention.

## Future improvements (intentionally NOT built)

- **Drive-time proximity**: replace the static ZIP map with a Google
  Maps Distance Matrix call from the base ZIP. Cheaper than a static
  map to maintain but adds an API key + per-lead cost. Slot into
  `classifyZip()` if and when it's wanted.
- **Job history weight**: returning customers with multiple completed
  paid jobs should outrank a one-time returning customer. Currently
  any phone/email match collapses to "returning".
- **ML-based**: keep the rule-based scorer as the floor; train a
  model on actual lead → booked conversion data once the sheet has
  enough rows tagged.
