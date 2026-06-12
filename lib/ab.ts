/**
 * Lightweight A/B bucketing for the Father's Day homepage promo.
 *
 * Three even-split treatments, assigned once per visitor by `middleware.ts`
 * (server-side cookie, so there's no client flicker) and only while the
 * campaign is active. The homepage reads the cookie to decide what to render;
 * the quote form tags its conversion with the variant (lib/ads.ts) so we can
 * see which treatment drives the most quotes.
 *
 *   control → homepage as-is (Weber banner only)
 *   modal   → scroll-triggered Father's Day pop-up
 *   hero    → temporary Father's Day homepage hero
 */
export const FD_VARIANT_COOKIE = "fd_variant";

export const FD_VARIANTS = ["control", "modal", "hero"] as const;
export type FdVariant = (typeof FD_VARIANTS)[number];

export function isFdVariant(v: string | undefined | null): v is FdVariant {
  return !!v && (FD_VARIANTS as readonly string[]).includes(v);
}

/** Even 1/3 split. Edge-runtime safe (uses Math.random). */
export function pickFdVariant(): FdVariant {
  return FD_VARIANTS[Math.floor(Math.random() * FD_VARIANTS.length)];
}
