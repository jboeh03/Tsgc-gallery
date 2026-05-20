/**
 * Affiliate product catalog for the /products page.
 *
 * Adding a product: append an entry to PRODUCTS and (optionally) a new
 * CATEGORIES entry if its category doesn't exist yet. The page picks up
 * order from this file — items appear in the order they're listed within
 * their category, and categories appear in the order defined below.
 *
 * Affiliate IDs (do not change without updating both programs):
 *   - Amazon Associates tag:  tarchlabs-20  (use the AMAZON_TAG helper, or
 *     pre-built amzn.to shortlinks that already carry the tag).
 *   - Grill Parts Replacement: ?ref=zsgtagbs  (use GPR_BASE for the
 *     storefront, or append &ref=zsgtagbs to any product URL).
 *
 * Affiliate disclosure copy lives in app/products/page.tsx.
 */

export const AMAZON_TAG = "tarchlabs-20";
export const GPR_BASE = "https://grillpartsreplacement.com/?ref=zsgtagbs";

/** Build an Amazon search URL pre-tagged with our Associates ID. */
export function amazonSearch(query: string): string {
  const q = encodeURIComponent(query);
  return `https://www.amazon.com/s?k=${q}&tag=${AMAZON_TAG}`;
}

export type Product = {
  id: string;
  name: string;
  brand?: string;
  category: ProductCategory;
  /** 1-3 sentence description. Plain text — no HTML. */
  description: string;
  /** What we like / when we'd recommend it. Optional. */
  techNote?: string;
  /**
   * Optional product image, served from /public. Drop a square JPG/PNG/WEBP
   * (~600-800px is plenty — Next.js will optimize) at
   *   public/products/<id>.jpg
   * and set this to `/products/<id>.jpg`. If left undefined, the page
   * falls back to a branded category placeholder.
   *
   * Sourcing note: don't hotlink Amazon product images — that's against
   * the Associates ToS. Use the manufacturer's press kit, GPR's product
   * page, or your own photos from a service visit.
   */
  image?: string;
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
  {
    id: "weber-spirit-genesis-grates",
    name: "Weber Spirit & Genesis Cooking Grates",
    brand: "Weber",
    category: "grates",
    description:
      "Cast-iron and stainless replacement grates for Weber Spirit II and Genesis II 2-, 3-, and 4-burner grills. Aftermarket pricing, factory fit.",
    techNote:
      "OEM Weber grates run $90+ a set. The aftermarket cast iron from GPR holds heat just as well for about half — what we recommend to most customers unless the grill is brand new.",
    url: GPR_BASE,
    affiliate: "Grill Parts Replacement",
    featured: true,
  },
  {
    id: "char-broil-grease-tray",
    name: "Char-Broil Grease Tray / Cup",
    brand: "Char-Broil",
    category: "parts",
    description:
      "Replacement grease pan and cup for most Char-Broil 2-, 3-, and 4-burner gas grills. Sized to drop right into the existing rails.",
    techNote:
      "Hands down the #1 part we replace on Char-Broils — the stamped trays rust through in 3-4 seasons. If yours is flaking, swap it before it leaks onto the burner box.",
    url: GPR_BASE,
    affiliate: "Grill Parts Replacement",
    featured: true,
  },
  {
    id: "heavy-duty-degreaser",
    name: "Heavy-Duty BBQ Degreaser",
    category: "cleaning",
    description:
      "Pro-strength citrus or oven-cleaner degreaser for in-between service upkeep. Spray on cold metal, let it sit 10-15 minutes, wipe with a damp microfiber — no wire brush needed.",
    techNote:
      "Skip the consumer-grade \"grill sprays.\" Easy-Off Heavy Duty (yellow can) or ZEP Citrus are what we actually use. Wear nitrile gloves and keep it off rubber gaskets and aluminum trim.",
    url: amazonSearch("zep heavy duty citrus degreaser"),
    affiliate: "Amazon",
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
