import Link from "next/link";
import { FATHERS_DAY } from "@/lib/campaign-fathers-day";
import FathersDayCountdown from "@/components/FathersDayCountdown";

/**
 * Temporary homepage hero for the Father's Day A/B "hero" variant. Reuses the
 * existing /fathers-day-hero.mp4 (same asset as the landing page) with homepage-
 * scoped copy and a CTA to /fathers-day. Server component — pure HTML/video, no
 * client JS. Only rendered while the campaign is active (gated in page.tsx).
 */
export default function FathersDayHero() {
  const featured =
    FATHERS_DAY.tiers.find((t) => t.featured) ?? FATHERS_DAY.tiers[0];

  return (
    <section className="relative flex min-h-[88vh] items-center overflow-hidden bg-navy-900 text-bone">
      <div className="absolute inset-0">
        <video
          className="h-full w-full object-cover"
          poster="/fathers-day-hero-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src="/fathers-day-hero.mp4" type="video/mp4" />
        </video>
        <div
          className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/85 to-navy-900/55"
          aria-hidden="true"
        />
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-burgundy-700/55 to-transparent mix-blend-multiply"
          aria-hidden="true"
        />
      </div>

      <div className="relative mx-auto max-w-4xl px-5 py-24 text-center md:py-28">
        <div className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200 md:text-sm">
          Father&apos;s Day · June 21 · Veteran-Founded
        </div>
        <div className="mx-auto mt-5 h-[3px] w-12 rounded-full bg-amber-300/80" />
        <h1 className="mt-6 font-display text-4xl leading-[1.05] tracking-tight md:text-6xl">
          Give Dad the Grill
          <br />
          He Forgot He Had.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-bone/85 md:text-lg">
          Skip the tie. This year, hand him back a grill that cooks like new —{" "}
          <span className="text-amber-200">25% off any cleaning</span>, or buy
          one and get the 2nd grill half off. Veteran-founded, we come to you.
        </p>

        <div className="mt-9">
          <FathersDayCountdown endISO={FATHERS_DAY.endISO} />
        </div>
        <p className="mt-3 text-xs uppercase tracking-widest text-bone/55">
          Offers end {FATHERS_DAY.shortDeadline}
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/fathers-day"
            className="inline-flex items-center justify-center rounded-md bg-burgundy px-7 py-3.5 text-sm font-semibold uppercase tracking-widest text-bone shadow transition hover:bg-burgundy-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            Treat Dad &rarr;
          </Link>
          <Link
            href={`/quote?promo=${featured.code}`}
            className="inline-flex items-center justify-center rounded-md px-5 py-3.5 text-sm font-semibold uppercase tracking-widest text-bone/90 underline underline-offset-4 transition hover:text-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            Book a cleaning
          </Link>
        </div>
      </div>
    </section>
  );
}
