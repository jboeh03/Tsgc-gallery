/**
 * Grill-repair brand cluster — generalizes the Weber pattern to other premium
 * brands. Parent hub at /grill-repair, brand hubs at /grill-repair/[brand], and
 * problem guides at /grill-repair/[brand]/[problem]. Each brand carries a
 * grillpartsreplacement.com affiliate deep link (?ref) for DIY searchers.
 *
 * Guide content is drafted per-brand via a multi-agent workflow and reviewed
 * before commit. Add a brand here and it gets a hub page, guide pages, metadata,
 * FAQ schema, finder entry, and sitemap rows automatically.
 */

import type { RepairGuide } from "./weber-repair-guides";
import contentJson from "@/data/grill-repair-content.json";

export type { RepairGuide };

export type BrandGroup = "gas" | "built-in" | "pellet";

export type RepairBrand = {
  slug: string;
  name: string;
  group: BrandGroup;
  /** Short hub-tile line. */
  blurb: string;
  /** Brand-hub intro paragraph. */
  intro: string;
  /** grillpartsreplacement.com affiliate deep link. */
  partsUrl: string;
  guides: RepairGuide[];
};

export const GROUP_LABELS: Record<BrandGroup, string> = {
  gas: "Premium gas",
  "built-in": "Built-in & luxury",
  pellet: "Pellet & smoker",
};

/** Affiliate ref carried on every grillpartsreplacement.com link. */
export const PARTS_REF = "Cincygrillcleaning";
export function partsCollectionUrl(slug: string): string {
  return `https://grillpartsreplacement.com/collections/${slug}?ref=${PARTS_REF}`;
}

// Brand metadata; blurb/intro/guides are merged from the reviewed content file
// (data/grill-repair-content.json), produced by the grill-repair-brands workflow.
type IntroContent = { slug: string; blurb: string; intro: string };
type GuideContent = RepairGuide & { brand: string };
const CONTENT = contentJson as unknown as { intros: IntroContent[]; guides: GuideContent[] };

const BRAND_META: { slug: string; name: string; group: BrandGroup }[] = [
  { slug: "napoleon", name: "Napoleon", group: "gas" },
  { slug: "traeger", name: "Traeger", group: "pellet" },
  { slug: "blaze", name: "Blaze", group: "built-in" },
];

export const GRILL_BRANDS: RepairBrand[] = BRAND_META.map((m) => {
  const intro = CONTENT.intros.find((i) => i.slug === m.slug);
  const guides: RepairGuide[] = CONTENT.guides
    .filter((g) => g.brand === m.slug)
    .map(({ brand: _brand, ...g }) => g);
  return {
    slug: m.slug,
    name: m.name,
    group: m.group,
    blurb: intro?.blurb ?? "",
    intro: intro?.intro ?? "",
    partsUrl: partsCollectionUrl(m.slug),
    guides,
  };
});

export function getBrand(slug: string): RepairBrand | undefined {
  return GRILL_BRANDS.find((b) => b.slug === slug);
}

export function getBrandGuide(brandSlug: string, problemSlug: string): { brand: RepairBrand; guide: RepairGuide } | undefined {
  const brand = getBrand(brandSlug);
  const guide = brand?.guides.find((g) => g.slug === problemSlug);
  if (!brand || !guide) return undefined;
  return { brand, guide };
}

/** Finder/index entries — includes Weber (which lives at its own URL). */
export type BrandIndexEntry = { name: string; group: BrandGroup; href: string };
export function brandFinderIndex(): BrandIndexEntry[] {
  const weber: BrandIndexEntry = { name: "Weber", group: "gas", href: "/weber-grill-repair" };
  return [
    weber,
    ...GRILL_BRANDS.map((b): BrandIndexEntry => ({ name: b.name, group: b.group, href: `/grill-repair/${b.slug}` })),
  ].sort((a, b) => a.name.localeCompare(b.name));
}
