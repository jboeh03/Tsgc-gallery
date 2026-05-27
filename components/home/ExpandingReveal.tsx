"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * The centerpiece. A windowed before/after photo pins to the viewport
 * and expands edge-to-edge as you scroll, then crossfades from the
 * grimed "before" to the restored "after" — a single grill, four hours
 * apart, told as one continuous move.
 */
export default function ExpandingReveal() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const frame = el.querySelector<HTMLElement>(".er-frame");
      const after = el.querySelector<HTMLElement>(".er-after");
      const imgs = el.querySelectorAll<HTMLElement>(".er-img");
      if (!frame || !after) return;

      if (reduce) {
        gsap.set(frame, { clipPath: "inset(0% round 0px)" });
        gsap.set(after, { opacity: 1 });
        return;
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ".er-pin",
          start: "top top",
          end: "+=190%",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      });

      tl.fromTo(
        frame,
        { clipPath: "inset(23% 30% 23% 30% round 26px)" },
        { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "power2.inOut", duration: 1 },
        0
      )
        .fromTo(imgs, { scale: 1.2 }, { scale: 1, ease: "power2.out", duration: 1 }, 0)
        .to(".er-eyebrow", { opacity: 0, duration: 0.2 }, 0.35)
        .to(".er-label-before", { opacity: 0, duration: 0.2 }, 0.55)
        .fromTo(after, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.55)
        .fromTo(".er-label-after", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.25 }, 0.72)
        .fromTo(".er-caption", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.3 }, 0.78);
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="bg-navy-900 text-bone">
      <div className="er-pin relative h-[100svh] min-h-[600px] w-full overflow-hidden">
        {/* Expanding photo frame */}
        <div
          className="er-frame absolute inset-0"
          style={{ clipPath: "inset(23% 30% 23% 30% round 26px)" }}
        >
          <div className="er-img absolute inset-0">
            <Image
              src="/gallery/tsg-011-before.jpeg"
              alt="Before: a DCS built-in grill blackened with soot and heavy carbon buildup across the grates and cookbox"
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>
          <div className="er-img er-after absolute inset-0 opacity-0">
            <Image
              src="/gallery/tsg-011-after.jpeg"
              alt="After: the same DCS built-in grill with a polished stainless hood, restored grates, and a spotless cookbox"
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(16,33,64,0.82), rgba(16,33,64,0.05) 40%, rgba(16,33,64,0.35))",
            }}
          />
        </div>

        {/* Floating eyebrow while windowed */}
        <div className="er-eyebrow pointer-events-none absolute inset-x-0 top-[16%] text-center">
          <p className="text-[11px] uppercase tracking-[0.4em] text-bone/70">
            See the Difference
          </p>
        </div>

        {/* Stage labels */}
        <span className="er-label-before absolute left-6 top-6 z-10 rounded-full border border-bone/30 bg-navy-900/40 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] backdrop-blur">
          Before
        </span>
        <span className="er-label-after absolute left-6 top-6 z-10 rounded-full bg-burgundy px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] opacity-0">
          After
        </span>

        {/* Caption revealed once expanded */}
        <div className="er-caption absolute inset-x-0 bottom-[12%] z-10 px-6 text-center opacity-0">
          <h2 className="font-display display-tight text-4xl md:text-6xl">
            Same grill. Four hours apart.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-bone/75">
            This is the standard on every job — no exceptions, no shortcuts.
          </p>
        </div>
      </div>
    </section>
  );
}
