/**
 * Father's Day 2026 campaign configuration.
 *
 * Self-contained config mirroring lib/campaign.ts's shape — it drives only the
 * /fathers-day landing page. It intentionally does NOT touch the site-wide promo
 * banner or the shared quote-form logic; CTAs deep-link to /quote?promo=CODE and
 * the quote form's free-text promo field carries the code through.
 *
 * Father's Day 2026 is Sunday, June 21. Offers end midnight EDT at the close of
 * the day (endISO = 2026-06-22T03:59:59Z). When the campaign ends the landing
 * page flips to an "ended" state — no manual deploy needed.
 *
 * TWO offers:
 *   1. DADS25  — 25% off any single cleaning (treat Dad, or gift it to him).
 *   2. DADSBOGO — Buy one, get the 2nd grill 50% off. Full price on the first,
 *      half off the second. From $299 for two smaller grills ($199 + ~$99.50),
 *      scaling up by model/size. Both must be booked AND paid before Father's Day.
 */
export const FATHERS_DAY = {
  id: "fathers-day-2026",
  name: "Father's Day 2026",
  // EDT — Cincinnati is Eastern. Midnight at the end of Father's Day (Sun Jun 21).
  endISO: "2026-06-22T03:59:59Z",
  shortDeadline: "Sun, June 21",
  longDeadline: "midnight on Father's Day · June 21, 2026",
  landingPath: "/fathers-day",
  tiers: [
    {
      id: "single",
      code: "DADS25",
      kind: "percent",
      percent: 25,
      label: "For Dad — or from you",
      headline: "25% off any cleaning",
      blurb:
        "Any single grill, any model. Treat Dad to a deep clean — or gift it to him. The easy way to hand back a grill that looks, and cooks, like the day he bought it.",
      featured: false,
    },
    {
      id: "bogo",
      code: "DADSBOGO",
      kind: "bogo",
      percent: 50, // the SECOND grill is 50% off
      priceFrom: 299, // from $199 + ~$99.50 for two smaller grills
      label: "The Bundle",
      headline: "Buy one, get the 2nd grill 50% off",
      blurb:
        "Two grills, one visit. Pay full price on the first and the second is half off — your grill and Dad's, or two at one address. From $299 for two smaller grills, scaling up by size. Both must be booked & paid before Father's Day.",
      featured: true,
    },
  ],
} as const;

export type FathersDayTier = (typeof FATHERS_DAY.tiers)[number];

export function isFathersDayActive(now: Date = new Date()): boolean {
  return now.getTime() <= new Date(FATHERS_DAY.endISO).getTime();
}

export function tierByCode(
  code: string | null | undefined,
): FathersDayTier | undefined {
  if (!code) return undefined;
  const upper = code.toUpperCase();
  return FATHERS_DAY.tiers.find((t) => t.code === upper);
}
