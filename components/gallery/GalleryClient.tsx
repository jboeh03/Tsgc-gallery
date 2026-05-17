"use client";

import { useState } from "react";
import LidLiftHero from "./LidLiftHero";
import BurnerKnobFilter, { type FilterValue } from "./BurnerKnobFilter";
import GalleryGrid from "./GalleryGrid";
import type { Job } from "@/lib/types";
import Link from "next/link";
import { SITE } from "@/lib/site";

type Props = {
  jobs: Job[];
  featured: Job;
};

export default function GalleryClient({ jobs, featured }: Props) {
  const [filter, setFilter] = useState<FilterValue>("all");

  return (
    <>
      <LidLiftHero job={featured} />
      <BurnerKnobFilter value={filter} onChange={setFilter} />
      <GalleryGrid jobs={jobs} filter={filter} />

      <section className="mx-auto max-w-3xl px-5 pb-12 text-center">
        <p className="uppercase tracking-widest text-burgundy text-xs font-semibold">
          More on Instagram
        </p>
        <h2 className="mt-3 font-display text-2xl md:text-3xl text-navy">
          See every grill we&apos;ve brought back.
        </h2>
        <p className="mt-3 text-ink/75">
          We post new before-and-after pairs all season. Follow along — and
          tag us when you fire yours up.
        </p>
        <a
          href={SITE.social.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-6 rounded-md border-2 border-navy text-navy px-6 py-3 font-semibold uppercase tracking-widest text-sm hover:bg-navy hover:text-bone"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
          @cincygrillcleaning
        </a>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-20 text-center">
        <h2 className="font-display text-3xl md:text-4xl text-navy">
          Ready to see yours on this page?
        </h2>
        <p className="mt-4 text-ink/80">
          A professional deep clean keeps your grill cooking like it did the
          day you bought it.
        </p>
        <Link
          href="/quote"
          className="inline-block mt-8 rounded-md bg-burgundy text-bone px-8 py-4 text-lg font-semibold hover:bg-burgundy-400 shadow"
        >
          Get a Quote
        </Link>
      </section>
    </>
  );
}
