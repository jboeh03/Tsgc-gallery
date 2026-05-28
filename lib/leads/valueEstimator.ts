/**
 * Estimate the dollar value of a job from a grill description.
 *
 * Mirrors the pricing tiers in lib/preview/claude.ts (the AI preview
 * system prompt) so a customer who describes their grill as "4-burner
 * Weber" lands in the same value bucket whether they came in via the
 * preview tool or via text. Keep the two in sync if pricing shifts.
 */

import type { ValueTier } from "./types";

const PREMIUM_KEYWORDS = [
  // Built-in brands
  "built-in", "built in", "builtin", "island",
  "lynx", "dcs", "hestan", "alfresco", "coyote", "fire magic", "firemagic",
  "twin eagles", "twineagles", "blaze",
  // Big sizes
  "36\"", "36 in", "36-inch", "42\"", "42 in", "42-inch", "48\"", "48-inch",
  "commercial",
  // Premium high-end portables/freestanding
  "summit",
];

const STANDARD_PLUS_KEYWORDS = [
  "4-burner", "4 burner", "four burner", "4burner",
  "5-burner", "5 burner", "5burner",
  "6-burner", "6 burner", "6burner",
  "premium pellet", "kamado", "big green egg", "biggreenegg", "primo",
  "kj classic", "kamado joe",
  "genesis", "genesis ii",
  "weber pro",
  "traeger pro 780", "traeger ironwood", "traeger timberline",
  // Premium pellet brands at standard+ tier
  "yoder", "rec tec", "rectec", "recteq",
];

const STANDARD_KEYWORDS = [
  "3-burner", "3 burner", "three burner", "3burner",
  "spirit", "weber spirit",
  "pellet", "pit boss", "pitboss",
  "traeger", "traeger 22", "traeger 34",
  "mid-size", "mid size",
];

const SMALL_KEYWORDS = [
  "2-burner", "2 burner", "two burner", "2burner",
  "portable", "kettle", "weber kettle", "smokey joe",
  "tabletop", "go-anywhere",
  "small grill", "small charcoal", "small gas",
];

const SMOKER_KEYWORDS = [
  "smoker", "offset", "vertical smoker", "wsm",
];

const GRIDDLE_KEYWORDS = [
  "griddle", "flat top", "flat-top", "flattop",
  "blackstone",
];

function matchesAny(text: string, keywords: string[]): boolean {
  return keywords.some((k) => text.includes(k));
}

export function classifyValueFromDescription(
  description: string | null | undefined
): { tier: ValueTier; estimatedJobUsdLow: number | null; estimatedJobUsdHigh: number | null } {
  if (!description || !description.trim()) {
    return { tier: "unknown", estimatedJobUsdLow: null, estimatedJobUsdHigh: null };
  }
  const t = description.toLowerCase();

  // Order matters — premium check first so "Lynx 36\"" doesn't get
  // captured by a generic "3-burner" word match later.
  if (matchesAny(t, PREMIUM_KEYWORDS)) {
    return { tier: "premium", estimatedJobUsdLow: 499, estimatedJobUsdHigh: 799 };
  }
  if (matchesAny(t, STANDARD_PLUS_KEYWORDS)) {
    return { tier: "standard_plus", estimatedJobUsdLow: 349, estimatedJobUsdHigh: 449 };
  }
  // Smoker / griddle land at "standard" tier — match these before generic
  // numeric burner mentions to avoid mis-pricing.
  if (matchesAny(t, SMOKER_KEYWORDS)) {
    return { tier: "standard", estimatedJobUsdLow: 249, estimatedJobUsdHigh: 399 };
  }
  if (matchesAny(t, GRIDDLE_KEYWORDS)) {
    return { tier: "standard", estimatedJobUsdLow: 229, estimatedJobUsdHigh: 329 };
  }
  if (matchesAny(t, STANDARD_KEYWORDS)) {
    return { tier: "standard", estimatedJobUsdLow: 249, estimatedJobUsdHigh: 379 };
  }
  if (matchesAny(t, SMALL_KEYWORDS)) {
    return { tier: "small", estimatedJobUsdLow: 199, estimatedJobUsdHigh: 299 };
  }

  return { tier: "unknown", estimatedJobUsdLow: null, estimatedJobUsdHigh: null };
}

/**
 * Use an explicit agreed/quoted price when one exists — more reliable
 * than guessing from a free-text description. Falls through to keyword
 * classification otherwise.
 */
export function classifyValue(args: {
  description: string | null | undefined;
  agreedPriceUsd: number | null;
  estimatedPriceLow: number | null;
  estimatedPriceHigh: number | null;
}): { tier: ValueTier; estimatedJobUsdLow: number | null; estimatedJobUsdHigh: number | null } {
  const explicit =
    args.agreedPriceUsd ?? args.estimatedPriceHigh ?? args.estimatedPriceLow;
  if (explicit != null && Number.isFinite(explicit)) {
    const high = args.agreedPriceUsd ?? args.estimatedPriceHigh ?? explicit;
    const low = args.estimatedPriceLow ?? args.agreedPriceUsd ?? explicit;
    let tier: ValueTier;
    if (high >= 499) tier = "premium";
    else if (high >= 349) tier = "standard_plus";
    else if (high >= 249) tier = "standard";
    else tier = "small";
    return { tier, estimatedJobUsdLow: low, estimatedJobUsdHigh: high };
  }
  return classifyValueFromDescription(args.description);
}

export function valueLabel(tier: ValueTier): string {
  switch (tier) {
    case "premium": return "Premium ($500+)";
    case "standard_plus": return "Standard+ ($349-499)";
    case "standard": return "Standard ($249-349)";
    case "small": return "Small ($199-249)";
    case "unknown": return "Unknown value";
  }
}
