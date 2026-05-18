import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getJobs } from "@/lib/jobs";
import { jobSlug, type Job } from "@/lib/types";
import { SITE } from "@/lib/site";
import JobDetailClient from "@/components/gallery/JobDetailClient";

type Params = { slug: string };

async function findJob(slug: string): Promise<Job | undefined> {
  const jobs = await getJobs();
  return jobs.find((j) => jobSlug(j) === slug);
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const job = await findJob(params.slug);
  if (!job) return { title: "Job not found" };
  return {
    title: `${job.grillModel} · ${job.neighborhood} — Gallery | ${SITE.name}`,
    description: `Before-and-after photos of a ${job.grillModel} we cleaned in ${job.neighborhood}. ${job.serviceHours}-hour service.`,
    openGraph: {
      title: `${job.grillModel} — restored in ${job.neighborhood}`,
      description: `${job.pairs.length} before-and-after pair${
        job.pairs.length > 1 ? "s" : ""
      } from this ${job.serviceHours}-hour job.`,
      type: "article",
      images: [job.pairs[0].after],
    },
  };
}

export default async function JobDetailPage({ params }: { params: Params }) {
  const job = await findJob(params.slug);
  if (!job) notFound();

  const formattedDate = new Date(job.date + "T00:00:00").toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  return (
    <div className="bg-bone">
      {/* Hero band */}
      <section className="bg-navy text-bone">
        <div className="mx-auto max-w-5xl px-5 py-12 md:py-16">
          <Link
            href="/gallery"
            className="text-xs uppercase tracking-widest text-bone/70 hover:text-burgundy-400"
          >
            ← Back to gallery
          </Link>
          <h1 className="mt-4 font-display text-3xl md:text-5xl leading-tight">
            {job.grillModel}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-bone/80">
            <span className="uppercase tracking-widest text-burgundy-400 font-semibold">
              {job.neighborhood}
            </span>
            <span>·</span>
            <span>{formattedDate}</span>
            <span>·</span>
            <span>{job.serviceHours} hrs</span>
            <span>·</span>
            <span className="capitalize">{job.grillType} grill</span>
          </div>
          {job.notes ? (
            <p className="mt-6 max-w-3xl text-bone/85 text-base md:text-lg leading-relaxed">
              {job.notes}
            </p>
          ) : null}
        </div>
      </section>

      {/* Pairs */}
      <JobDetailClient job={job} />

      {/* CTA */}
      <section className="bg-white border-t border-border">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <h2 className="font-display text-2xl md:text-3xl text-navy">
            Want yours next?
          </h2>
          <p className="mt-3 text-ink/80">
            Free quote — we&apos;ll follow up within 24 hours.
          </p>
          <Link
            href="/quote"
            className="inline-block mt-6 rounded-md bg-burgundy text-bone px-8 py-4 text-sm font-semibold uppercase tracking-widest hover:bg-burgundy-400 shadow"
          >
            Get a Quote
          </Link>
        </div>
      </section>
    </div>
  );
}
