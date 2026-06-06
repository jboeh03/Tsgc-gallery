import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { WEBER_REPAIR_GUIDES } from "@/lib/weber-repair-guides";
import { GRILL_BRANDS } from "@/lib/grill-repair-brands";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths = ["", "/services", "/about", "/gallery", "/products", "/quote", "/weber-grill-repair", "/grill-repair"];
  const weberGuidePaths = WEBER_REPAIR_GUIDES.map((g) => `/weber-grill-repair/${g.slug}`);
  const brandPaths = GRILL_BRANDS.map((b) => `/grill-repair/${b.slug}`);
  const brandGuidePaths = GRILL_BRANDS.flatMap((b) => b.guides.map((g) => `/grill-repair/${b.slug}/${g.slug}`));
  return [...paths, ...weberGuidePaths, ...brandPaths, ...brandGuidePaths].map((p) => ({
    url: `${SITE.canonicalUrl}${p}`,
    lastModified: now,
    changeFrequency: p === "" ? "weekly" : "monthly",
    priority: p === "" ? 1 : 0.7,
  }));
}
