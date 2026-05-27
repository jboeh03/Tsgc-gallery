import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Hide the AI preview tool from indexing on every host while we
        // iterate on it; middleware also 404s these paths on the public domain.
        disallow: ["/preview", "/api/"],
      },
    ],
    sitemap: `${SITE.canonicalUrl}/sitemap.xml`,
  };
}
