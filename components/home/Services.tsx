"use client";

import Link from "next/link";
import Reveal from "@/components/motion/Reveal";

const SERVICES = [
  {
    n: "01",
    title: "Deep Degreasing",
    body: "Years of buildup cause flare-ups and uneven heat. We break down and degrease every internal surface — completely.",
    points: ["Cook box interior", "Heat plates & flavorizer bars", "Lid interior & drip pans", "Control knobs"],
  },
  {
    n: "02",
    title: "Cleaning & Sanitation",
    body: "Restaurant-grade results in your backyard. We scrub, rinse, and sanitize every surface until it passes inspection.",
    points: ["Grill grates & racks", "Full cook box", "Exterior surfaces", "Burner covers"],
  },
  {
    n: "03",
    title: "Safety Inspection",
    body: "Every job includes a full inspection. We catch issues before they become problems — with zero upsell pressure.",
    points: ["Burners & igniters", "Gas tubes & regulators", "Thermometers", "Rotisserie racks"],
  },
];

export default function Services() {
  return (
    <section className="bg-bone">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-36">
        <Reveal className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.4em] text-burgundy">What We Do</p>
          <h2 className="mt-5 font-display display-tight text-4xl md:text-6xl text-navy">
            Three passes. One immaculate result.
          </h2>
        </Reveal>

        <Reveal stagger={0.14} className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
          {SERVICES.map((s) => (
            <article
              key={s.n}
              className="group relative bg-bone p-8 transition-colors duration-500 hover:bg-white md:p-10"
            >
              <span className="font-display text-5xl text-border transition-colors duration-500 group-hover:text-burgundy-400">
                {s.n}
              </span>
              <h3 className="mt-6 font-display text-2xl text-navy">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/75">{s.body}</p>
              <ul className="mt-6 space-y-2 border-t border-border pt-6 text-sm text-ink/70">
                {s.points.map((p) => (
                  <li key={p} className="flex items-center gap-3">
                    <span aria-hidden className="h-px w-4 bg-burgundy/60" />
                    {p}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </Reveal>

        <Reveal className="mt-14" delay={0.1}>
          <Link
            href="/services"
            className="group inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.25em] text-navy hover:text-burgundy"
          >
            Explore all services
            <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
