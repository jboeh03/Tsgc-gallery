"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SITE } from "@/lib/site";

export default function ClosingCta() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".closing-bg",
        { yPercent: -12 },
        {
          yPercent: 12,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
        }
      );
      gsap.from(".closing-rise", {
        opacity: 0,
        y: 40,
        duration: 1.1,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: { trigger: el, start: "top 70%" },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative overflow-hidden bg-navy-900 text-bone">
      <div className="closing-bg absolute inset-0 -z-0 scale-110">
        <Image
          src="/gallery/tsg-013-after.jpeg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(16,33,64,0.86), rgba(16,33,64,0.7) 50%, rgba(139,31,47,0.55))",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-32 text-center md:py-48">
        <p className="closing-rise text-[11px] uppercase tracking-[0.4em] text-bone/65">
          Cincinnati · Northern Kentucky · Dayton
        </p>
        <h2 className="closing-rise mt-6 font-display display-tight text-5xl md:text-7xl lg:text-8xl">
          Ready for a clean grill?
        </h2>
        <p className="closing-rise mx-auto mt-6 max-w-xl text-base text-bone/80 md:text-lg">
          Send the short form and we&apos;ll follow up as soon as we can. No
          commitment, no pressure — just an honest quote.
        </p>
        <div className="closing-rise mt-10 flex flex-wrap items-center justify-center gap-6">
          <Link
            href="/quote"
            className="group inline-flex items-center gap-3 rounded-full bg-bone px-9 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-navy-900 transition-colors hover:bg-white"
          >
            Get a Free Quote
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
          <a
            href={SITE.phoneHref}
            className="text-sm font-medium uppercase tracking-[0.2em] text-bone/85 hover:text-burgundy-400"
          >
            {SITE.phone}
          </a>
        </div>
      </div>
    </section>
  );
}
