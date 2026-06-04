"use client";

import { useEffect, useState } from "react";

/**
 * Live "Webers cleaned this sprint" tally. Count-up animation on mount
 * (respects prefers-reduced-motion). Teases the reward once the milestone hits.
 */
export default function WeberTicker({
  count,
  target,
  teaseText,
}: {
  count: number;
  target: number;
  teaseText: string;
}) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(count);
      return;
    }
    if (count <= 0) return;
    const steps = Math.min(count, 30);
    const stepMs = 900 / steps;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(Math.round((count * i) / steps));
      if (i >= steps) clearInterval(id);
    }, stepMs);
    return () => clearInterval(id);
  }, [count]);

  const pct = target > 0 ? Math.min(100, Math.round((count / target) * 100)) : 0;
  const hit = count >= target;

  return (
    <div className="rounded-2xl border border-border bg-white p-6 text-center">
      <div className="font-display text-6xl md:text-7xl text-burgundy tabular-nums leading-none">{shown}</div>
      <p className="mt-2 text-sm uppercase tracking-widest text-muted">Webers cleaned this sprint</p>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-bone">
        <div className="h-full rounded-full bg-burgundy transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-ink/60">
        {hit ? "Goal reached! 🎉" : `${count} of ${target} toward the goal`}
      </p>
      {hit && <p className="mt-2 text-sm font-medium text-navy">{teaseText}</p>}
    </div>
  );
}
