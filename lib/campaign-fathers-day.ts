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
      code: "DADS15",
      percent: 15,
      label: "For Dad",
      headline: "15% off any cleaning",
      blurb:
        "Any single grill, any model. The easy way to hand Dad back a grill that looks — and cooks — like new.",
      featured: false,
    },
    {
      id: "bundle",
      code: "DADSBUNDLE",
      percent: 25,
      label: "The Bundle",
      headline: "25% off clean + repair",
      blurb:
        "A clean paired with a repair — or two grills at one address. One visit, both grills handled, real savings for the household.",
      featured: true,
    },
    {
      id: "gift",
      code: "DADSGIFT",
      percent: 0,
      label: "Gift It",
      headline: "Gift a clean + free grate scrub",
      blurb:
        "Buy a cleaning as a gift for Dad and we add a free deep grate scrub — the dirtiest job, on the house. The gift he'll actually use this summer.",
      featured: false,
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
