"use client";

import { SITE } from "@/lib/site";
import Reveal from "@/components/motion/Reveal";

const TESTIMONIALS = [
  {
    quote:
      "Courteous, professional, communicative, and very thorough. The pricing was very fair. I'm almost afraid to use my grill now because it's so clean.",
    author: "Paddack B.",
    location: "Cincinnati, OH",
  },
  {
    quote:
      "Quick, easy estimate and squeezed us in a few days later. We invested in our grill, so having it cleaned properly is a small price for the longevity. Highly recommend.",
    author: "Alex C.",
    location: "Cincinnati, OH",
  },
  {
    quote:
      "Brought it back to looking like it would pass a Health Department inspection with flying colors. Exactly what I needed for my old Weber.",
    author: "John F.",
    location: "Cincinnati, OH",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-36">
        <Reveal className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.4em] text-burgundy">Reviews</p>
          <h2 className="mt-5 font-display display-tight text-4xl md:text-6xl text-navy">
            Five stars, all over the Tri-State.
          </h2>
        </Reveal>

        <Reveal stagger={0.16} className="mt-16 grid gap-10 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.author} className="flex flex-col">
              <div className="text-burgundy tracking-[0.3em] text-sm">★★★★★</div>
              <blockquote className="mt-5 font-display text-xl leading-snug text-navy md:text-2xl">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 text-[11px] uppercase tracking-[0.3em] text-muted">
                {t.author} · {t.location}
              </figcaption>
            </figure>
          ))}
        </Reveal>

        <Reveal className="mt-16" delay={0.1}>
          <a
            href={SITE.social.googleReview}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor
            className="group inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.25em] text-navy hover:text-burgundy"
          >
            Leave us a Google review
            <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
