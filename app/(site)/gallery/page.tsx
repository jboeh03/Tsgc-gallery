import type { Metadata } from "next";
import { getJobs, getFeaturedJob } from "@/lib/jobs";
import GalleryClient from "@/components/gallery/GalleryClient";

export const metadata: Metadata = {
  title: "Before & After Gallery | Tri-State Grill Cleaning",
  description:
    "Real before-and-after photos of gas, charcoal, and built-in grill cleanings across Cincinnati, Northern Kentucky, and Dayton. See the deep-clean results for yourself.",
  alternates: { canonical: "/gallery" },
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
