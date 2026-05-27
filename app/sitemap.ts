import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { getJobs } from "@/lib/jobs";
import { jobSlug } from "@/lib/types";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const paths = ["", "/services", "/about", "/gallery", "/products", "/quote"];
  const staticEntries: MetadataRoute.Sitemap = paths.map((p) => ({
    url: `${SITE.canonicalUrl}${p}`,
    lastModified: now,
    changeFrequency: p === "" ? "weekly" : "monthly",
    priority: p === "" ? 1 : 0.7,
  }));

  const jobs = await getJobs();
  const galleryEntries: MetadataRoute.Sitemap = jobs.map((job) => ({
    url: `${SITE.canonicalUrl}/gallery/${jobSlug(job)}`,
    lastModified: new Date(job.date),
    changeFrequency: "yearly",
    priority: 0.5,
  }));

  return [...staticEntries, ...galleryEntries];
}
