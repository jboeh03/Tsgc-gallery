"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SITE } from "@/lib/site";

export default function Hero() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      if (!reduce) {
        // Intro: mask-reveal the headline lines, then fade the rest in.
        const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
        tl.from(".hero-line > span", {
          yPercent: 120,
          duration: 1.2,
          stagger: 0.12,
        })
          .from(".hero-eyebrow", { opacity: 0, y: 20, duration: 0.9 }, 0.2)
          .from(".hero-sub", { opacity: 0, y: 24, duration: 1 }, "-=0.7")
          .from(".hero-actions > *", { opacity: 0, y: 20, duration: 0.8, stagger: 0.12 }, "-=0.6")
          .from(".hero-cue", { opacity: 0, duration: 0.8 }, "-=0.4");

        // Background parallax + fade as the hero scrolls away.
        gsap.to(".hero-bg", {
          yPercent: 18,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to(".hero-content", {
          yPercent: -12,
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true },
        });
      }
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative h-[100svh] min-h-[640px] overflow-hidden bg-navy-900 text-bone">
      <div className="hero-bg absolute inset-0 -z-0">
        <Image
          src="/gallery/tsg-015-after.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="ken-burns object-cover"
        />
        {/* Layered overlays for depth + text legibility */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(16,33,64,0.92) 0%, rgba(16,33,64,0.45) 45%, rgba(16,33,64,0.55) 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(1100px 600px at 18% 12%, rgba(139,31,47,0.35), transparent 60%)",
          }}
        />
      </div>

      <div className="hero-content relative z-10 flex h-full flex-col justify-end">
        <div className="mx-auto w-full max-w-6xl px-6 pb-[14vh]">
          <p className="hero-eyebrow text-[11px] md:text-xs uppercase tracking-[0.42em] text-bone/65">
            Veteran-Founded · At-Home Service
          </p>

          <h1 className="mt-6 font-display display-tight text-[14vw] leading-[0.92] sm:text-7xl md:text-8xl lg:text-[7.5rem]">
            <span className="line-mask hero-line">
              <span className="block">Restored to</span>
            </span>
            <span className="line-mask hero-line">
              <span className="block text-burgundy-400">showroom condition.</span>
            </span>
          </h1>

          <p className="hero-sub mt-7 max-w-xl text-base md:text-lg text-bone/80 leading-relaxed">
            Concierge grill restoration for Greater Cincinnati, Northern
            Kentucky, and Dayton. We break it down, degrease every surface,
            and leave it cooking like the day it was uncrated — at your home.
          </p>

          <div className="hero-actions mt-10 flex flex-wrap items-center gap-6">
            <Link
              href="/quote"
              data-cursor
              className="group inline-flex items-center gap-3 rounded-full bg-bone text-navy-900 px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] transition-colors hover:bg-white"
            >
              Request a Quote
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
            <a
              href={SITE.phoneHref}
              data-cursor
              className="text-sm font-medium uppercase tracking-[0.2em] text-bone/80 hover:text-burgundy-400"
            >
              {SITE.phone}
            </a>
          </div>
        </div>

        <div className="hero-cue absolute inset-x-0 bottom-7 flex flex-col items-center gap-2 text-bone/55">
          <span className="text-[10px] uppercase tracking-[0.4em]">Scroll</span>
          <svg className="scroll-cue" width="16" height="26" viewBox="0 0 16 26" fill="none" aria-hidden>
            <rect x="1" y="1" width="14" height="24" rx="7" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="8" cy="8" r="2" fill="currentColor" />
          </svg>
        </div>
      </div>
    </section>
  );
}
