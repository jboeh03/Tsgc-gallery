"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const LINE = "We don't just clean grills. We bring them back — surface by surface, until fire meets steel the way it was meant to.";

/**
 * Large minimal statement that reveals word-by-word as it's scrubbed
 * through the viewport. Sets the premium, unhurried tone right after
 * the hero.
 */
export default function Manifesto() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".manifesto-word",
        { opacity: 0.12 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.4,
          scrollTrigger: {
            trigger: el,
            start: "top 75%",
            end: "bottom 60%",
            scrub: true,
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="bg-bone">
      <div className="mx-auto max-w-5xl px-6 py-28 md:py-40">
        <p className="mb-8 text-[11px] uppercase tracking-[0.4em] text-burgundy">
          The Standard
        </p>
        <p className="font-display display-tight text-3xl leading-snug text-navy md:text-5xl md:leading-[1.15]">
          {LINE.split(" ").map((w, i) => (
            <span key={i} className="manifesto-word inline-block">
              {w}&nbsp;
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
