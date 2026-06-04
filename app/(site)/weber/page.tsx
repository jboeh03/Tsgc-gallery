import type { Metadata } from "next";
import Image from "next/image";
import { getJobs } from "@/lib/jobs";
import { WEBER_SPRINT, isWeberSprintActive } from "@/lib/campaign-weber";
import { readWeberSprintCount } from "@/lib/db/reads";
import FathersDayCountdown from "@/components/FathersDayCountdown";
import WeberTicker from "@/components/weber/WeberTicker";
import WeberBookingForm from "@/components/weber/WeberBookingForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Weber Sprint — 15% off your Weber deep clean | Tri-State Grill Cleaning",
  description: "Two weeks only: book a Weber deep clean, 15% off (30% with a neighbor). Instant photo quote, pay online, pick your day.",
  robots: { index: false, follow: false },
};

export default async function WeberPage() {
  const active = isWeberSprintActive();
  const [jobs, count] = await Promise.all([getJobs(), readWeberSprintCount()]);
  const webers = jobs.filter((j) => j.grillModel?.toLowerCase().includes("weber")).slice(0, 4);

  return (
    <div className="bg-bone">
      {/* Hero */}
      <section className="bg-navy text-bone">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center md:py-28">
          <div className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200 md:text-sm">
            Weber Sprint · 2 weeks only
          </div>
          <h1 className="display-tight mt-5 font-display text-4xl tracking-tight md:text-6xl">
            Your Weber, restored to like-new.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-bone/80">
            For the next two weeks we&apos;re on a mission to deep-clean as many Webers as we can.
            <strong className="text-bone"> 15% off any Weber</strong> — or <strong className="text-bone">30% off</strong> when
            you book with a neighbor or friend.
          </p>
          {active ? (
            <div className="mt-8 flex flex-col items-center gap-4">
              <FathersDayCountdown endISO={WEBER_SPRINT.endISO} />
              <a href="#book" className="rounded-md bg-burgundy px-6 py-3 text-sm font-semibold uppercase tracking-wider text-bone hover:bg-burgundy-700">
                Get my instant quote →
              </a>
            </div>
          ) : (
            <p className="mt-8 text-amber-200">This sprint has ended — but we&apos;d still love to clean your Weber. Call or text us.</p>
          )}
        </div>
      </section>

      {/* Ticker + booking */}
      <section id="book" className="mx-auto max-w-5xl px-5 py-14 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-start">
          <div className="space-y-6">
            <WeberTicker count={count} target={WEBER_SPRINT.milestone.target} teaseText={WEBER_SPRINT.milestone.teaseText} />
            <div className="rounded-2xl border border-border bg-white p-6 text-sm text-ink/75 space-y-3">
              <h2 className="font-display text-lg text-navy">How it works</h2>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Snap a photo of your Weber and tell us the model.</li>
                <li>Get an instant, honest quote — discount already applied.</li>
                <li>Pay online and pick your day. We text to confirm the window.</li>
              </ol>
            </div>
          </div>
          {active ? <WeberBookingForm /> : null}
        </div>
      </section>

      {/* Real Weber before/afters */}
      {webers.length > 0 && (
        <section className="bg-white border-y border-border">
          <div className="mx-auto max-w-5xl px-5 py-14 md:py-16">
            <h2 className="font-display text-2xl text-navy text-center">Real Webers we&apos;ve brought back</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {webers.map((j) => {
                const pair = j.pairs[0];
                if (!pair) return null;
                return (
                  <div key={j.id} className="overflow-hidden rounded-xl border border-border">
                    <div className="grid grid-cols-2">
                      <div className="relative aspect-[4/3]">
                        <Image src={pair.before} alt={pair.beforeAlt || "Before"} fill className="object-cover" sizes="(max-width:640px) 50vw, 25vw" />
                        <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white">Before</span>
                      </div>
                      <div className="relative aspect-[4/3]">
                        <Image src={pair.after} alt={pair.afterAlt || "After"} fill className="object-cover" sizes="(max-width:640px) 50vw, 25vw" />
                        <span className="absolute left-2 top-2 rounded bg-burgundy px-2 py-0.5 text-[10px] uppercase tracking-wider text-bone">After</span>
                      </div>
                    </div>
                    <div className="px-4 py-3 text-sm">
                      <p className="font-medium text-navy">{j.grillModel}</p>
                      <p className="text-ink/60">{j.neighborhood}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Founder note */}
      <section className="mx-auto max-w-3xl px-5 py-14 text-center">
        <p className="text-[11px] uppercase tracking-widest text-burgundy">From Jeff</p>
        <p className="mt-3 text-ink/80">
          Weber builds a grill worth keeping for 15+ years — but only if it&apos;s cared for. This sprint is my push to
          get as many local Webers cooking like new again before summer hits full swing. Book yours, grab a neighbor,
          and let&apos;s get them clean.
        </p>
        <p className="mt-3 font-display text-lg text-navy">— Jeff, Tri-State Grill Cleaning</p>
      </section>
    </div>
  );
}
