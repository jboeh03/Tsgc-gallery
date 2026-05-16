"use client";

import { useEffect, useId, useState } from "react";
import type { Job } from "@/lib/types";

type Props = {
  job: Job;
};

export default function LidLiftHero({ job }: Props) {
  const [open, setOpen] = useState(false);
  const [steamKey, setSteamKey] = useState(0);
  const [isCoarse, setIsCoarse] = useState(false);
  const panelId = useId();

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setIsCoarse(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  const handleToggle = () => {
    setOpen((v) => {
      const next = !v;
      if (next) setSteamKey((k) => k + 1);
      return next;
    });
  };

  const formattedDate = new Date(job.date + "T00:00:00").toLocaleDateString(
    "en-US",
    { month: "short", year: "numeric" }
  );

  const verb = isCoarse ? "TAP" : "CLICK";

  return (
    <section
      aria-labelledby="lidlift-heading"
      className="relative w-full bg-bone pt-10 pb-16 md:pt-16 md:pb-24 overflow-hidden"
    >
      <div className="mx-auto max-w-5xl px-5">
        <h2
          id="lidlift-heading"
          className="font-display text-3xl md:text-5xl text-navy text-center leading-tight"
        >
          The Difference Is Black and White.
          <br />
          <span className="text-burgundy">
            Well, Greasy and Spotless.
          </span>
        </h2>
        <p className="mt-5 text-center text-ink/75 max-w-2xl mx-auto">
          Real grills, real homes across Cincinnati, NKY, and Dayton.{" "}
          {isCoarse ? "Tap" : "Click"} or scrub to see what a professional
          cleaning actually looks like.
        </p>

        <div className="mt-12 flex justify-center">
          <div className="lidlift-stage w-full max-w-[640px]">
            {/* Side shelves */}
            <div className="hidden sm:flex justify-between items-end -mb-2 px-2">
              <div className="h-3 w-16 rounded-l bg-navy-700" aria-hidden />
              <div className="h-3 w-16 rounded-r bg-navy-700" aria-hidden />
            </div>

            {/* The grill */}
            <div className="relative mx-auto" style={{ width: "100%" }}>
              {/* COOKBOX (body) */}
              <div
                className="relative rounded-b-[28px] bg-gradient-to-b from-navy-700 to-navy-900 shadow-2xl border border-black/40"
                style={{ aspectRatio: "16 / 11" }}
              >
                {/* Burgundy accent stripe */}
                <div
                  aria-hidden
                  className="absolute left-0 right-0 top-3 h-1.5 bg-burgundy"
                />
                {/* Cookbox interior (where photos show when open) */}
                <div
                  id={panelId}
                  className="absolute inset-3 top-8 rounded-md overflow-hidden bg-black"
                  aria-live="polite"
                >
                  {/* BEFORE photo (visible when lid is closed) */}
                  <img
                    src={job.beforeImage}
                    alt={job.beforeAlt}
                    loading="eager"
                    fetchPriority="high"
                    className="lidlift-photo absolute inset-0 w-full h-full object-cover"
                    data-visible={!open}
                  />
                  {/* AFTER photo (visible when lid is open) */}
                  <img
                    src={job.afterImage}
                    alt={job.afterAlt}
                    loading="eager"
                    fetchPriority="high"
                    className="lidlift-photo absolute inset-0 w-full h-full object-cover"
                    data-visible={open}
                  />
                  {/* Steam */}
                  <div
                    key={steamKey}
                    aria-hidden
                    className="lidlift-steam absolute left-1/2 -translate-x-1/2 bottom-4 w-40 h-24 rounded-full"
                    style={{
                      background:
                        "radial-gradient(closest-side, rgba(255,255,255,0.9), rgba(255,255,255,0))",
                    }}
                    data-active={open}
                  />
                </div>
                {/* Control panel */}
                <div className="absolute bottom-2 left-3 right-3 h-3 rounded bg-navy-900/60" aria-hidden />
              </div>

              {/* LEGS */}
              <div className="flex justify-between px-6 -mt-1" aria-hidden>
                <div className="h-10 w-2 bg-navy-900 rounded-b" />
                <div className="h-10 w-2 bg-navy-900 rounded-b" />
              </div>

              {/* LID — absolutely positioned, hinges from top */}
              <button
                type="button"
                onClick={handleToggle}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleToggle();
                  }
                }}
                aria-expanded={open}
                aria-controls={panelId}
                aria-label={
                  open
                    ? "Close grill lid to view before photo"
                    : "Open grill lid to reveal after photo"
                }
                className="lidlift-lid absolute left-0 right-0 top-0 rounded-t-[28px] bg-gradient-to-b from-navy-600 to-navy-800 border border-black/40 shadow-lid focus:outline-none"
                style={{ height: "62%" }}
                data-open={open}
              >
                {/* Handle */}
                <span
                  aria-hidden
                  className="absolute left-1/2 -translate-x-1/2 top-3 h-2 w-24 rounded-full bg-black/60"
                />
                {/* Burgundy accent */}
                <span
                  aria-hidden
                  className="absolute left-0 right-0 bottom-2 h-1.5 bg-burgundy"
                />
                {/* Viewing window with before photo + CTA */}
                <span
                  aria-hidden
                  className="absolute inset-x-6 inset-y-7 rounded-md overflow-hidden border border-black/50"
                >
                  <img
                    src={job.beforeImage}
                    alt=""
                    aria-hidden
                    className="w-full h-full object-cover"
                    style={{ opacity: open ? 0 : 1, transition: "opacity 300ms" }}
                  />
                  <span className="absolute inset-0 bg-black/50" />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="font-display text-bone text-2xl md:text-3xl tracking-widest text-center px-4">
                      {open ? `${verb} TO CLOSE` : `${verb} TO OPEN`}
                    </span>
                  </span>
                </span>
              </button>
            </div>

            {/* Placard */}
            <div className="mt-6 mx-auto max-w-md text-center bg-white border border-navy/10 rounded-md py-3 px-4 shadow-sm">
              <p className="text-sm uppercase tracking-widest text-burgundy">
                Featured job
              </p>
              <p className="mt-1 font-semibold text-navy">
                {job.neighborhood}
              </p>
              <p className="text-sm text-ink/75">
                {formattedDate} · {job.grillModel}
              </p>
              {job.notes ? (
                <p className="mt-2 text-sm italic text-ink/60">{job.notes}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
