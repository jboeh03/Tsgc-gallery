"use client";

import { useState } from "react";
import LidLiftHero from "./LidLiftHero";
import BurnerKnobFilter, { type FilterValue } from "./BurnerKnobFilter";
import GalleryGrid from "./GalleryGrid";
import type { Job } from "@/lib/types";
import Link from "next/link";

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
