"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type RevealProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  /** vertical travel in px */
  y?: number;
  delay?: number;
  duration?: number;
  /** when set, animates direct children with this stagger instead of self */
  stagger?: number;
  start?: string;
};

/**
 * Fade + rise on scroll-into-view. With `stagger`, animates the
 * element's direct children in sequence (for grids and lists).
 * Falls back to fully visible under prefers-reduced-motion or if JS
 * never runs (no inline opacity:0 is written until GSAP executes).
 */
export default function Reveal({
  children,
  className,
  as: Tag = "div",
  y = 44,
  delay = 0,
  duration = 1.05,
  stagger,
  start = "top 84%",
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const targets =
        stagger != null ? (Array.from(el.children) as Element[]) : el;
      gsap.from(targets, {
        opacity: 0,
        y,
        duration,
        delay,
        ease: "power3.out",
        stagger: stagger ?? 0,
        scrollTrigger: { trigger: el, start },
      });
    }, el);

    return () => ctx.revert();
  }, [y, delay, duration, stagger, start]);

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}
