import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { WEBER_REPAIR_GUIDES } from "@/lib/weber-repair-guides";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths = ["", "/services", "/about", "/gallery", "/products", "/quote", "/weber-grill-repair"];
  const guidePaths = WEBER_REPAIR_GUIDES.map((g) => `/weber-grill-repair/${g.slug}`);
  return [...paths, ...guidePaths].map((p) => ({
    url: `${SITE.canonicalUrl}${p}`,
    lastModified: now,
    changeFrequency: p === "" ? "weekly" : "monthly",
    priority: p === "" ? 1 : 0.7,
  }));
}
