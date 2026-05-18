"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "tsgc-scrub-enabled";

type Props = {
  enabled: boolean;
  onChange: (next: boolean) => void;
};

/**
 * "Turn off the heat" — flips the gallery cards between the interactive
 * scrub canvas and a static before/after split. Defaults to ON; the choice
 * persists across pages and visits via localStorage.
 */
export default function ScrubToggle({ enabled, onChange }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "off" && enabled) onChange(false);
    } catch {
      /* ignore */
    }
    // intentionally run only on mount — pulls the persisted choice once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    const next = !enabled;
    onChange(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-5 mt-2 mb-4 flex items-center justify-end gap-3">
      <span className="text-xs text-muted" aria-hidden>
        {enabled
          ? "Scrub mode is on. Tap any photo and wipe to reveal."
          : "Standard view. Tap any card to see the full job."}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={
          enabled ? "Turn off scrub mode (heat off)" : "Turn on scrub mode (fire it up)"
        }
        onClick={toggle}
        suppressHydrationWarning
        className={`group relative inline-flex items-center gap-2 rounded-full px-1 py-1 transition-colors border ${
          enabled
            ? "bg-burgundy border-burgundy-700"
            : "bg-navy-900 border-navy-700"
        }`}
      >
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] uppercase tracking-widest font-bold transition ${
            enabled ? "bg-burgundy-700 text-amber-200" : "text-bone/50"
          }`}
        >
          <span aria-hidden>{enabled ? "🔥" : "🔥"}</span>
          Heat on
        </span>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] uppercase tracking-widest font-bold transition ${
            !enabled ? "bg-bone text-navy" : "text-bone/50"
          }`}
        >
          <span aria-hidden>{enabled ? "❄" : "❄"}</span>
          Heat off
        </span>
      </button>
      {/* Tiny helper text below for first-timers */}
      {mounted ? null : null}
    </div>
  );
}
