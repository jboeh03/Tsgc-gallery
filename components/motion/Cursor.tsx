"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/**
 * Minimal two-part cursor: a fast inner dot and a lagging outer ring.
 * The ring swells over interactive elements ([data-cursor], links,
 * buttons). mix-blend-mode keeps it legible over any background.
 *
 * Only mounts on fine-pointer (mouse) devices; touch devices skip it
 * entirely via the early return + CSS media query.
 */
export default function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;
    const r = ring.current;
    const d = dot.current;
    if (!r || !d) return;

    gsap.set([r, d], { xPercent: -50, yPercent: -50, opacity: 0 });

    const xr = gsap.quickTo(r, "x", { duration: 0.55, ease: "power3" });
    const yr = gsap.quickTo(r, "y", { duration: 0.55, ease: "power3" });
    const xd = gsap.quickTo(d, "x", { duration: 0.1, ease: "power3" });
    const yd = gsap.quickTo(d, "y", { duration: 0.1, ease: "power3" });

    let shown = false;
    const move = (e: MouseEvent) => {
      if (!shown) {
        gsap.to([r, d], { opacity: 1, duration: 0.4 });
        shown = true;
      }
      xr(e.clientX);
      yr(e.clientY);
      xd(e.clientX);
      yd(e.clientY);
    };

    const interactive = "a, button, [data-cursor], input, textarea, select, summary";
    const over = (e: Event) => {
      if ((e.target as HTMLElement)?.closest?.(interactive)) {
        gsap.to(r, { scale: 2.3, borderColor: "rgba(168,43,61,0.9)", duration: 0.35, ease: "power3.out" });
        gsap.to(d, { scale: 0, duration: 0.35, ease: "power3.out" });
      }
    };
    const out = (e: Event) => {
      if ((e.target as HTMLElement)?.closest?.(interactive)) {
        gsap.to(r, { scale: 1, borderColor: "rgba(247,243,238,0.7)", duration: 0.35, ease: "power3.out" });
        gsap.to(d, { scale: 1, duration: 0.35, ease: "power3.out" });
      }
    };
    const leave = () => gsap.to([r, d], { opacity: 0, duration: 0.3 });
    const enter = () => gsap.to([r, d], { opacity: 1, duration: 0.3 });

    window.addEventListener("mousemove", move);
    document.addEventListener("mouseover", over);
    document.addEventListener("mouseout", out);
    document.documentElement.addEventListener("mouseleave", leave);
    document.documentElement.addEventListener("mouseenter", enter);
    document.documentElement.classList.add("has-custom-cursor");

    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", over);
      document.removeEventListener("mouseout", out);
      document.documentElement.removeEventListener("mouseleave", leave);
      document.documentElement.removeEventListener("mouseenter", enter);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, []);

  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden />
      <div ref={dot} className="cursor-dot" aria-hidden />
    </>
  );
}
