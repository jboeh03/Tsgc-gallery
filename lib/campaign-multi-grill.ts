/**
 * Multi-Grill Weekend 2026 — a short push for whole-collection cleanings.
 *
 * Built for households with more than one grill at a single address (new-home
 * buyers who inherited a lineup, backyard cooks with a grill + smoker + griddle,
 * etc.). The more grills we clean in one visit, the less drive time for us — so
 * the discount grows with the count. Every brand and type is welcome: gas grills,
 * pellet smokers, Blackstone-style griddles, Weber, Traeger, and the rest.
 *
 * Self-contained config mirroring lib/campaign-fathers-day.ts / campaign-weber.ts.
 * It intentionally does NOT touch the site-wide promo banner or shared quote
 * logic; CTAs deep-link to /quote?promo=CODE and the quote form carries the code
 * through. When the deadline passes the landing page flips to an "ended" state —
 * no manual deploy needed.
 */
export const MULTI_GRILL = {
  id: "multi-grill-2026",
  name: "Multi-Grill Weekend",
  // EDT (UTC-4) — Cincinnati is Eastern. Ends midnight at the close of Sun, Jul 12.
  endISO: "2026-07-13T03:59:59Z",
  shortDeadline: "Sun, July 12",
  longDeadline: "midnight this Sunday · July 12",
  landingPath: "/multi-grill",
  tiers: [
    {
      id: "single",
      code: "SOLO10",
      percent: 10,
      count: "One grill",
      label: "Just the one",
      headline: "10% off a single grill",
      blurb:
        "Any brand, any type — gas, pellet smoker, or griddle. The simplest way to get one grill cooking like new.",
      featured: false,
    },
    {
      id: "duo",
      code: "DUO15",
      percent: 15,
      count: "Two grills",
      label: "The pair",
      headline: "15% off two grills",
      blurb:
        "Book two grills at one address and we take 15% off both. Your grill and the smoker, or you and a neighbor next door.",
      featured: false,
    },
    {
      id: "trio",
      code: "TRIO25",
      percent: 25,
      count: "Three or more",
      label: "The whole lineup",
      headline: "25% off three or more",
      blurb:
        "Got a whole collection — grill, smoker, and griddle? Book three or more at one address and we take 25% off the entire visit. One trip, one crew, every grill done.",
      featured: true,
    },
  ],
} as const;

export type MultiGrillTier = (typeof MULTI_GRILL.tiers)[number];

export function isMultiGrillActive(now: Date = new Date()): boolean {
  return now.getTime() <= new Date(MULTI_GRILL.endISO).getTime();
}

export function tierByCode(code: string | null | undefined): MultiGrillTier | undefined {
  if (!code) return undefined;
  const upper = code.toUpperCase();
  return MULTI_GRILL.tiers.find((t) => t.code === upper);
}
