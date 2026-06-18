"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const STEPS = [
  { n: "01", title: "Request a Quote", body: "Send the short form or call. We follow up within 24 hours with honest pricing." },
  { n: "02", title: "Schedule Your Clean", body: "Pick a time that works. We come to your home — no hauling, no dropoff." },
  { n: "03", title: "We Do the Work", body: "Full break-down, degrease, clean, inspect. Two to six hours, start to finish." },
  { n: "04", title: "Fire It Up", body: "Your grill is ready to cook — cleaner, safer, better-tasting from day one." },
];

export default function Process() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // The vertical line draws downward as the section scrolls.
      gsap.fromTo(
        ".process-line",
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          transformOrigin: "top",
          scrollTrigger: { trigger: el, start: "top 60%", end: "bottom 75%", scrub: true },
        }
      );
      gsap.from(".process-step", {
        opacity: 0,
        x: -32,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.18,
        scrollTrigger: { trigger: el, start: "top 65%" },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="bg-navy text-bone">
      <div className="mx-auto max-w-5xl px-6 py-24 md:py-36">
        <div className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.4em] text-bone/50">The Process</p>
          <h2 className="mt-5 font-display display-tight text-4xl md:text-6xl">
            Effortless, from quote to first cook.
          </h2>
        </div>

        <ol className="relative mt-16 pl-10 md:pl-16">
          {/* Track + animated draw line */}
          <span aria-hidden className="absolute left-[3px] top-2 bottom-2 w-px bg-bone/15 md:left-[5px]" />
          <span aria-hidden className="process-line absolute left-[3px] top-2 bottom-2 w-px bg-burgundy md:left-[5px]" />

          {STEPS.map((s) => (
            <li key={s.n} className="process-step relative pb-12 last:pb-0">
              <span
                aria-hidden
                className="absolute -left-[37px] top-1.5 h-2.5 w-2.5 rounded-full bg-burgundy ring-4 ring-navy md:-left-[59px]"
              />
              <div className="flex items-baseline gap-4">
                <span className="font-display text-sm tracking-[0.3em] text-bone/45">{s.n}</span>
                <h3 className="font-display text-2xl md:text-3xl">{s.title}</h3>
              </div>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-bone/70">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-14 pl-10 md:pl-16">
          <Link
            href="/quote"
            className="group inline-flex items-center gap-3 rounded-full bg-burgundy px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] transition-colors hover:bg-burgundy-400"
          >
            Start Your Quote
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
