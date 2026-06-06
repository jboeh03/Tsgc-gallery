import Link from "next/link";
import { WEBER_SPRINT, isWeberSprintActive } from "@/lib/campaign-weber";

/**
 * Temporary home-page band promoting the Weber Sprint. Renders only while the
 * sprint is live (isWeberSprintActive) and self-retires past endISO — no deploy
 * needed. The live "X of 30" thermometer lives on /weber; this stays static.
 */
export default function WeberPromoSection() {
  if (!isWeberSprintActive()) return null;

  return (
    <section className="bg-burgundy text-bone">
      <div className="mx-auto max-w-6xl px-5 py-12 md:py-16 grid gap-8 md:grid-cols-[1.6fr_1fr] md:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-amber-200">
            🔥 Weber Sprint · 2 weeks only
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl leading-tight">
            Got a Weber? Let&apos;s bring it back to life.
          </h2>
          <p className="mt-4 max-w-xl text-bone/85 leading-relaxed">
            <strong className="text-bone">15% off</strong> any Weber deep clean —{" "}
            <strong className="text-bone">30% off</strong> when you book with a neighbor or
            friend within 5 miles. Snap a photo, get a real-time estimate, and we&apos;ll text
            you a link to lock your spot.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={WEBER_SPRINT.landingPath}
              className="rounded-md bg-bone text-burgundy px-6 py-3 text-sm font-semibold uppercase tracking-widest hover:bg-amber-100 shadow"
            >
              Book your Weber →
            </Link>
            <Link
              href="/gallery"
              className="text-sm font-semibold uppercase tracking-widest text-amber-200 underline underline-offset-4 hover:text-amber-100"
            >
              See before &amp; afters
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-bone/20 bg-burgundy-700/40 p-6 text-center">
          <p className="font-display text-5xl md:text-6xl leading-none text-amber-200">
            {WEBER_SPRINT.milestone.target}
          </p>
          <p className="mt-2 text-sm uppercase tracking-widest text-bone/80">
            Webers, two weeks
          </p>
          <p className="mt-4 text-sm italic text-bone/75">
            We&apos;re racing to clean {WEBER_SPRINT.milestone.target} Webers across Cincinnati.
            Watch the live count →
          </p>
          <Link
            href={WEBER_SPRINT.landingPath}
            className="mt-3 inline-block text-xs font-semibold uppercase tracking-widest text-amber-200 underline underline-offset-4 hover:text-amber-100"
          >
            Track the sprint
          </Link>
        </div>
      </div>
    </section>
  );
}
