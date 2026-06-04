"use client";

import { useEffect, useState } from "react";

/**
 * Live countdown to the Father's Day deadline. Client-only because it ticks.
 * Server-renders a static "—" fallback (no layout shift, works without JS),
 * then hydrates to the live value. Hidden entirely once the deadline passes.
 */
function parts(endMs: number, nowMs: number) {
  const diff = Math.max(0, endMs - nowMs);
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    done: diff <= 0,
  };
}

const UNITS = [
  ["days", "Days"],
  ["hours", "Hrs"],
  ["minutes", "Min"],
  ["seconds", "Sec"],
] as const;

export default function FathersDayCountdown({ endISO }: { endISO: string }) {
  const endMs = new Date(endISO).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const p = now === null ? null : parts(endMs, now);
  if (p?.done) return null;

  return (
    <div
      className="flex items-stretch justify-center gap-2 sm:gap-3"
      role="timer"
      aria-label="Time remaining until the Father's Day offer ends"
    >
      {UNITS.map(([key, label]) => {
        const value = p === null ? null : (p[key] as number);
        return (
          <div
            key={key}
            className="flex min-w-[3.75rem] flex-col items-center rounded-lg bg-navy-900/40 px-2.5 py-2.5 ring-1 ring-bone/15 sm:min-w-[4.5rem]"
          >
            <span className="font-display text-2xl leading-none tabular-nums text-bone sm:text-3xl">
              {value === null ? "—" : String(value).padStart(2, "0")}
            </span>
            <span className="mt-1 text-[10px] uppercase tracking-widest text-bone/55">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
