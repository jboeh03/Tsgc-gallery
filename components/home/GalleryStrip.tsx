"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Reveal from "@/components/motion/Reveal";

const SHOTS = [
  { src: "/gallery/tsg-010-after.jpeg", label: "Weber Genesis · Restored" },
  { src: "/gallery/tsg-012-after.jpeg", label: "Built-in · Restored" },
  { src: "/gallery/tsg-013-after.jpeg", label: "Cart grill · Restored" },
  { src: "/gallery/tsg-014-after.webp", label: "Stainless · Restored" },
  { src: "/gallery/tsg-015-after.webp", label: "Cookbox · Restored" },
  { src: "/gallery/tsg-010-before.jpeg", label: "Before we arrived" },
];

/**
 * Horizontal film-strip of finished work that drifts sideways as the
 * section scrolls past — classic cinematic parallax. Each frame lifts
 * and brightens on hover.
 */
export default function GalleryStrip() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".strip-track",
        { xPercent: 4 },
        {
          xPercent: -52,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.8 },
        }
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="overflow-hidden bg-bone py-24 md:py-32">
      <Reveal className="mx-auto mb-12 flex max-w-6xl items-end justify-between gap-6 px-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-burgundy">The Work</p>
          <h2 className="mt-5 font-display display-tight text-4xl md:text-6xl text-navy">
            A portfolio of restored fire.
          </h2>
        </div>
        <Link
          href="/gallery"
          className="hidden shrink-0 items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-navy hover:text-burgundy md:inline-flex"
        >
          Full gallery →
        </Link>
      </Reveal>

      <div className="strip-track flex w-max gap-5 px-6 will-change-transform">
        {SHOTS.map((s, i) => (
          <figure
            key={i}
            className="group relative aspect-[4/5] w-[68vw] shrink-0 overflow-hidden rounded-2xl bg-navy-900 sm:w-[44vw] md:w-[30vw] lg:w-[24vw]"
          >
            <Image
              src={s.src}
              alt={s.label}
              fill
              sizes="(max-width: 640px) 68vw, (max-width: 1024px) 44vw, 24vw"
              className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-navy-900/80 via-transparent to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-60"
            />
            <figcaption className="absolute inset-x-0 bottom-0 p-5 text-xs uppercase tracking-[0.25em] text-bone/85">
              {s.label}
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-10 px-6 text-center md:hidden">
        <Link
          href="/gallery"
          className="text-sm font-semibold uppercase tracking-[0.25em] text-navy hover:text-burgundy"
        >
          Full gallery →
        </Link>
      </div>
    </section>
  );
}
