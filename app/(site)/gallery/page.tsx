import type { Metadata } from "next";
import { getJobs, getFeaturedJob } from "@/lib/jobs";
import GalleryClient from "@/components/gallery/GalleryClient";

// Re-read every 30s so admin-uploaded gallery jobs appear without a rebuild.
export const revalidate = 30;

export const metadata: Metadata = {
  title: "Gallery · Tri-State Grill Cleaning",
  description:
    "Before and after photos of grill cleanings across Cincinnati, Northern Kentucky, and Dayton.",
};

export default async function GalleryPage() {
  const jobs = await getJobs();
  const featured = getFeaturedJob(jobs);
  if (!featured) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-20 text-center">
        <h1 className="font-display text-3xl text-navy">Gallery coming soon</h1>
        <p className="mt-4 text-ink/80">
          Check back shortly — fresh before-and-after photos on the way.
        </p>
      </section>
    );
  }
  return <GalleryClient jobs={jobs} featured={featured} />;
}
