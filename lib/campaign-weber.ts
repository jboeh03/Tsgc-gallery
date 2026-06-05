/**
 * Weber Sprint 2026 — a 2-week push to book as many Weber grills as possible.
 *
 * Self-contained config (mirrors lib/campaign.ts / lib/campaign-fathers-day.ts).
 * `priceQuote()` is THE single source of truth for the charged amount — imported
 * by both /api/weber/quote (display) and /api/weber/checkout (the real charge,
 * re-derived server-side so a tampered client can't underpay). The required
 * photo drives the condition assessment shown to the customer, not the price.
 *
 * EDIT the tier prices + milestone below to your real numbers.
 */

export const WEBER_SPRINT = {
  id: "weber-sprint-2026",
  name: "Weber Sprint",
  source: "weber-sprint", // jobs.source value the ticker counts
  landingPath: "/weber",

  // 14-day window (EDT). Flip endISO and the page/banner auto-retire.
  startISO: "2026-06-04T00:00:00Z",
  endISO: "2026-06-18T03:59:59Z",
  shortDeadline: "Wed, June 17",

  discount: {
    base: 15, // % off, baseline
    neighbor: 30, // % off if the "booking with a neighbor/friend" box is checked
  },

  // Price tiers by burner count. basePrice is the standard (pre-discount) charge.
  tiers: [
    { id: "weber-2", minBurners: 2, maxBurners: 2, basePrice: 299, label: "2-burner Weber" },
    { id: "weber-3", minBurners: 3, maxBurners: 3, basePrice: 349, label: "3-burner Weber" },
    { id: "weber-4", minBurners: 4, maxBurners: 4, basePrice: 395, label: "4-burner Weber" },
    { id: "weber-5p", minBurners: 5, maxBurners: 99, basePrice: 425, label: "5+ burner Weber" },
  ],

  // Live "Webers cleaned" thermometer. `baseline` seeds the gauge (grills
  // already cleaned this week) on top of the live paid-booking count.
  milestone: {
    target: 30,
    baseline: 4,
    teaseText: "Reach 30 and something fun unlocks.",
  },
} as const;

export type WeberModel = "Spirit" | "Genesis" | "Summit" | "Other";
export type WeberTier = (typeof WEBER_SPRINT.tiers)[number];

export function isWeberSprintActive(now: Date = new Date()): boolean {
  const t = now.getTime();
  return t >= Date.parse(WEBER_SPRINT.startISO) && t <= Date.parse(WEBER_SPRINT.endISO);
}

export function tierForBurners(burners: number): WeberTier {
  return (
    WEBER_SPRINT.tiers.find((t) => burners >= t.minBurners && burners <= t.maxBurners) ??
    WEBER_SPRINT.tiers[WEBER_SPRINT.tiers.length - 1]
  );
}

export function discountPercent(neighbor: boolean): number {
  return neighbor ? WEBER_SPRINT.discount.neighbor : WEBER_SPRINT.discount.base;
}

/** Single source of truth for the charged amount (whole dollars). */
export function priceQuote(input: { burners: number; neighbor: boolean }): {
  tier: WeberTier;
  basePrice: number;
  discountPercent: number;
  discountedPrice: number;
} {
  const tier = tierForBurners(input.burners);
  const pct = discountPercent(input.neighbor);
  const discountedPrice = Math.round(tier.basePrice * (1 - pct / 100));
  return { tier, basePrice: tier.basePrice, discountPercent: pct, discountedPrice };
}
