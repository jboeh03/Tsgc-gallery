/**
 * Memorial Day 2026 campaign configuration.
 * Drives the landing page, the site-wide promo banner, and the quote form's
 * promo-code recognition. When the campaign ends, the banner auto-hides and
 * the landing page flips to an "ended" state — no manual deploy needed.
 */
export const CAMPAIGN = {
  id: "memorial-day-2026",
  name: "Memorial Day 2026",
  // EDT — Cincinnati is Eastern. Midnight at end of Memorial Day (Mon May 25).
  endISO: "2026-05-26T03:59:59Z",
  shortDeadline: "Mon, May 25",
  longDeadline: "midnight on Memorial Day · May 25, 2026",
  landingPath: "/memorial-day",
  tiers: [
    {
      id: "standard",
      code: "MEMORIAL10",
      percent: 10,
      label: "Single Grill",
      headline: "10% off any cleaning",
      blurb:
        "Any single grill, any model. The simplest way to start the season clean.",
      featured: false,
    },
    {
      id: "neighbor",
      code: "MEMORIAL30",
      percent: 30,
      label: "Neighbor Bundle",
      headline: "30% off — bring a neighbor",
      blurb:
        "Book alongside a neighbor — or two grills at one address — and we take 30% off both. Less drive time for us, real savings for you.",
      featured: true,
    },
    {
      id: "repair",
      code: "MEMORIALFIX",
      percent: 20,
      label: "Parts & Repair",
      headline: "20% off parts & repair",
      blurb:
        "Igniters, grates, burners, regulators. Any parts or repair job booked before the deadline.",
      featured: false,
    },
  ],
} as const;

export type CampaignTier = (typeof CAMPAIGN.tiers)[number];

export function isCampaignActive(now: Date = new Date()): boolean {
  return now.getTime() <= new Date(CAMPAIGN.endISO).getTime();
}

export function tierByCode(code: string | null | undefined): CampaignTier | undefined {
  if (!code) return undefined;
  const upper = code.toUpperCase();
  return CAMPAIGN.tiers.find((t) => t.code === upper);
}
