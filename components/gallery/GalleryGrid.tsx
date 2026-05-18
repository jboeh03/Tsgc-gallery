"use client";

import { useMemo } from "react";
import ScrubCard from "./ScrubCard";
import type { Job } from "@/lib/types";
import type { FilterValue } from "./BurnerKnobFilter";

type Props = {
  jobs: Job[];
  filter: FilterValue;
  scrubEnabled?: boolean;
};

export default function GalleryGrid({ jobs, filter, scrubEnabled = true }: Props) {
  const filtered = useMemo(() => {
    if (filter === "all") return jobs;
    return jobs.filter((j) => j.grillType === filter);
  }, [jobs, filter]);

  return (
    <section
      aria-label="Job gallery"
      className="mx-auto max-w-6xl px-5 pb-16"
    >
      {filtered.length === 0 ? (
        <p className="text-center text-ink/70 py-12">
          No jobs match that filter yet. Try a different grill type.
        </p>
      ) : (
        <div
          key={filter}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-[fadeIn_220ms_ease-out]"
        >
          {filtered.map((j) => (
            <ScrubCard key={j.id} job={j} scrubEnabled={scrubEnabled} />
          ))}
        </div>
      )}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .grid { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
