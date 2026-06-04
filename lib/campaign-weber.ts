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

  // Price tiers by burner count (matches the Claude pricing logic in lib/preview).
  // basePrice is the pre-discount charge. EDIT to your real Weber pricing.
  tiers: [
    { id: "weber-2-3", minBurners: 2, maxBurners: 3, basePrice: 249, label: "Spirit · 2–3 burner" },
    { id: "weber-4", minBurners: 4, maxBurners: 4, basePrice: 399, label: "Genesis · 4 burner" },
    { id: "weber-5p", minBurners: 5, maxBurners: 99, basePrice: 449, label: "Summit · 5+ burner" },
  ],

  // Live ticker milestone. EDIT target + tease.
  milestone: {
    target: 50,
    teaseText: "Hit the goal and we unlock something special — stay tuned.",
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
