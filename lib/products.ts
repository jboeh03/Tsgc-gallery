/**
 * Affiliate product catalog for the /products page.
 *
 * Adding a product: append an entry to PRODUCTS and (optionally) a new
 * CATEGORIES entry if its category doesn't exist yet. The page picks up
 * order from this file — items appear in the order they're listed within
 * their category, and categories appear in the order defined below.
 *
 * Affiliate disclosure copy lives in app/products/page.tsx.
 */

export type Product = {
  id: string;
  name: string;
  brand?: string;
  category: ProductCategory;
  /** 1-3 sentence description. Plain text — no HTML. */
  description: string;
  /** What we like / when we'd recommend it. Optional. */
  techNote?: string;
  /** The affiliate URL (Amazon shortlink, grillpartsreplacement, etc.). */
  url: string;
  /** Marketplace label shown on the button. */
  affiliate: "Amazon" | "Grill Parts Replacement" | "Direct";
  /** Optional — bumps the item to the top of its category. */
  featured?: boolean;
};

export type ProductCategory =
  | "covers"
  | "tools"
  | "grates"
  | "cleaning"
  | "parts"
  | "accessories";

export const CATEGORIES: { id: ProductCategory; label: string; blurb: string }[] = [
  {
    id: "covers",
    label: "Grill Covers",
    blurb:
      "A good cover is the cheapest way to extend a grill's life. Sun, snow, and rain do more damage than cooking ever will.",
  },
  {
    id: "tools",
    label: "Tools",
    blurb: "What we actually keep in the truck.",
  },
  {
    id: "grates",
    label: "Grates & Heat Plates",
    blurb: "Replacement grates and heat shields for the most common grills we service.",
  },
  {
    id: "cleaning",
    label: "Cleaning Supplies",
    blurb: "Brushes, scrapers, and degreasers safe for everyday between-service upkeep.",
  },
  {
    id: "parts",
    label: "Parts",
    blurb: "Burners, igniters, regulators — the wear-and-tear stuff.",
  },
  {
    id: "accessories",
    label: "Accessories",
    blurb: "Thermometers, lights, side tables, and other extras.",
  },
];

export const PRODUCTS: Product[] = [
  {
    id: "weber-grill-cover",
    name: "Weber Grill Cover",
    brand: "Weber",
    category: "covers",
    description:
      "Heavy-duty cover sized for Weber gas grills. Resists fading, mildew, and Cincinnati winters — the single best $50 you can spend to keep your grill looking new.",
    techNote:
      "We see uncovered Weber Genesis and Spirit grills lose a full year of life expectancy compared to covered ones. Worth it on day one.",
    url: "https://amzn.to/4uppPvs",
    affiliate: "Amazon",
    featured: true,
  },
];

export function productsByCategory() {
  const byCat = new Map<ProductCategory, Product[]>();
  for (const cat of CATEGORIES) byCat.set(cat.id, []);
  for (const p of PRODUCTS) {
    const arr = byCat.get(p.category);
    if (arr) arr.push(p);
  }
  for (const [, arr] of byCat) {
    arr.sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false));
  }
  return CATEGORIES.map((c) => ({ ...c, items: byCat.get(c.id) ?? [] })).filter(
    (c) => c.items.length > 0
  );
}
