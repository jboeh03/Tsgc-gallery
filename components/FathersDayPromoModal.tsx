"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FATHERS_DAY } from "@/lib/campaign-fathers-day";
import FathersDayCountdown from "@/components/FathersDayCountdown";

/**
 * Father's Day A/B "modal" variant. A tasteful pop-up that fires once per
 * session after the visitor scrolls ~35% down the homepage (with a time
 * fallback), promoting the two offers and driving to /fathers-day. Dismissible;
 * remembers via sessionStorage so it never nags within a session.
 *
 * Only mounted on the homepage when the visitor is in the "modal" bucket and the
 * campaign is active (gated in app/(site)/page.tsx).
 */
const SEEN_KEY = "fd_modal_seen";

export default function FathersDayPromoModal() {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false); // drives the enter transition
  const closeRef = useRef<HTMLButtonElement>(null);

  const dismiss = useCallback(() => {
    setShown(false);
    setOpen(false);
  }, []);

  // Trigger logic: scroll depth + time fallback, once per session.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return;
    } catch {
      /* sessionStorage blocked — just proceed */
    }

    let done = false;
    const fire = () => {
      if (done) return;
      done = true;
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* ignore */
      }
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
      setOpen(true);
    };
    const onScroll = () => {
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      if (max > 200 && window.scrollY / max > 0.35) fire();
    };
    const timer = setTimeout(fire, 16000);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, []);

  // On open: play the enter transition, lock scroll, focus close, wire Escape.
  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => setShown(true));
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, dismiss]);

  if (!open) return null;

  const tiers = FATHERS_DAY.tiers;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fd-modal-title"
    >
      {/* backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={dismiss}
        className={`absolute inset-0 bg-navy-900/70 backdrop-blur-sm transition-opacity duration-300 ${
          shown ? "opacity-100" : "opacity-0"
        }`}
      />
      {/* card */}
      <div
        className={`relative w-full max-w-md overflow-hidden rounded-2xl bg-bone shadow-2xl ring-1 ring-amber-400/40 transition-all duration-300 ${
          shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-navy/10 text-navy transition hover:bg-navy/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy"
        >
          <span aria-hidden="true" className="text-lg leading-none">
            &times;
          </span>
        </button>

        <div className="bg-navy-900 px-6 pb-6 pt-7 text-center text-bone">
          <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-200">
            Father&apos;s Day · June 21
          </div>
          <h2
            id="fd-modal-title"
            className="mt-3 font-display text-2xl leading-tight md:text-3xl"
          >
            Give Dad the grill he forgot he had.
          </h2>
          <div className="mt-4">
            <FathersDayCountdown endISO={FATHERS_DAY.endISO} />
          </div>
        </div>

        <div className="space-y-3 px-6 py-5">
          {tiers.map((t) => (
            <div
              key={t.id}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                t.featured
                  ? "border-amber-400 bg-amber-50"
                  : "border-border bg-white"
              }`}
            >
              <div className="font-display text-xl text-burgundy">
                {t.kind === "bogo" ? "BOGO" : `${t.percent}%`}
              </div>
              <div className="text-sm leading-snug text-ink">
                <div className="font-semibold text-navy">{t.headline}</div>
                {t.kind === "bogo" && "priceFrom" in t && t.priceFrom ? (
                  <div className="text-xs text-muted">
                    From ${t.priceFrom} for two
                  </div>
                ) : (
                  <div className="text-xs text-muted">Treat Dad, or gift it</div>
                )}
              </div>
            </div>
          ))}

          <Link
            href="/fathers-day"
            onClick={dismiss}
            className="mt-2 flex items-center justify-center rounded-md bg-burgundy px-5 py-3 text-sm font-semibold uppercase tracking-widest text-bone shadow transition hover:bg-burgundy-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy"
          >
            Treat Dad &rarr;
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="w-full text-center text-xs uppercase tracking-widest text-muted transition hover:text-ink"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
