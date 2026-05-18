"use client";

import { useEffect, useState } from "react";
import type { Job, Pair } from "@/lib/types";
import ScrubToggle from "./ScrubToggle";

const STORAGE_KEY = "tsgc-scrub-enabled";

export default function JobDetailClient({ job }: { job: Job }) {
  const [scrubEnabled, setScrubEnabled] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "off") setScrubEnabled(false);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <>
      <ScrubToggle enabled={scrubEnabled} onChange={setScrubEnabled} />
      <section className="mx-auto max-w-5xl px-5 pb-16">
        <div className="space-y-10">
          {job.pairs.map((pair, idx) => (
            <PairBlock
              key={`${job.id}-${idx}`}
              pair={pair}
              index={idx}
              total={job.pairs.length}
              scrubEnabled={scrubEnabled}
            />
          ))}
        </div>
      </section>
    </>
  );
}

function PairBlock({
  pair,
  index,
  total,
  scrubEnabled,
}: {
  pair: Pair;
  index: number;
  total: number;
  scrubEnabled: boolean;
}) {
  return (
    <figure className="rounded-xl overflow-hidden bg-white shadow-sm border border-border">
      {total > 1 ? (
        <header className="px-5 py-3 bg-bone border-b border-border flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-burgundy font-semibold">
            {pair.caption ?? `Photo ${index + 1} of ${total}`}
          </span>
          <span className="text-xs text-muted">
            {index + 1} / {total}
          </span>
        </header>
      ) : null}

      {scrubEnabled ? (
        <SideBySide pair={pair} />
      ) : (
        <Stacked pair={pair} />
      )}
    </figure>
  );
}

/**
 * Default ("heat on") layout for the detail page — side-by-side at desktop,
 * stacked on small screens. Bigger surface than the gallery card, so the
 * scrub interaction would be heavier here. The detail page stays simple
 * (full pair shown), and the gallery grid is where the scrub mechanic lives.
 */
function SideBySide({ pair }: { pair: Pair }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 bg-navy">
      <div className="relative">
        <img
          src={pair.before}
          alt={pair.beforeAlt}
          className="w-full h-auto block"
          loading="lazy"
        />
        <span className="absolute top-3 left-3 inline-block rounded bg-black/70 text-bone text-[11px] font-bold uppercase tracking-widest px-2.5 py-1">
          Before
        </span>
      </div>
      <div className="relative md:border-l-2 border-t-2 md:border-t-0 border-bone">
        <img
          src={pair.after}
          alt={pair.afterAlt}
          className="w-full h-auto block"
          loading="lazy"
        />
        <span className="absolute top-3 right-3 inline-block rounded bg-burgundy text-bone text-[11px] font-bold uppercase tracking-widest px-2.5 py-1">
          After
        </span>
      </div>
    </div>
  );
}

function Stacked({ pair }: { pair: Pair }) {
  return (
    <div className="bg-navy">
      <div className="relative">
        <img
          src={pair.before}
          alt={pair.beforeAlt}
          className="w-full h-auto block"
          loading="lazy"
        />
        <span className="absolute top-3 left-3 inline-block rounded bg-black/70 text-bone text-[11px] font-bold uppercase tracking-widest px-2.5 py-1">
          Before
        </span>
      </div>
      <div className="relative border-t-2 border-bone">
        <img
          src={pair.after}
          alt={pair.afterAlt}
          className="w-full h-auto block"
          loading="lazy"
        />
        <span className="absolute top-3 right-3 inline-block rounded bg-burgundy text-bone text-[11px] font-bold uppercase tracking-widest px-2.5 py-1">
          After
        </span>
      </div>
    </div>
  );
}
