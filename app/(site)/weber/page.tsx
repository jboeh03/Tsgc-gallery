import type { Metadata } from "next";
import Image from "next/image";
import { getJobs } from "@/lib/jobs";
import { WEBER_SPRINT, isWeberSprintActive } from "@/lib/campaign-weber";
import { readWeberSprintCount } from "@/lib/db/reads";
import FathersDayCountdown from "@/components/FathersDayCountdown";
import WeberThermometer from "@/components/weber/WeberThermometer";
import WeberBookingForm from "@/components/weber/WeberBookingForm";

export const dynamic = "force-dynamic";

const CAPTIONS: Record<string, string> = {
  "tsg-016": "The Sear Station and flavorizer bars looked done. They weren't — look at the cookbox.",
  "tsg-017": "Twelve years old and still worth saving. Cleaned up like it had years left, because it does.",
  "tsg-015": "Three burners, full GS4 system, stripped back to clean metal and ready for summer.",
  "tsg-014": "Big 4-burner with a Sear Station — the more grill there is, the bigger the before-and-after.",
};

export const metadata: Metadata = {
  title: "Weber Sprint — 15% off your Weber deep clean | Tri-State Grill Cleaning",
  description: "Two weeks only: book a Weber deep clean, 15% off (30% with a neighbor). Instant photo quote, pay online, pick your day.",
  robots: { index: false, follow: false },
};

export default async function WeberPage() {
  const active = isWeberSprintActive();
  const [jobs, count] = await Promise.all([getJobs(), readWeberSprintCount()]);
  const webers = jobs.filter((j) => j.grillModel?.toLowerCase().includes("weber")).slice(0, 4);
  const cleanedCount = WEBER_SPRINT.milestone.baseline + count;

  return (
    <div className="bg-bone">
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy text-bone">
        <div className="absolute inset-0">
          <video
            className="h-full w-full object-cover"
            poster="/weber-hero-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
            tabIndex={-1}
          >
            <source src="/weber-hero.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/85 to-navy/60" aria-hidden="true" />
        </div>
        <div className="relative mx-auto max-w-4xl px-5 py-24 text-center md:py-32">
          <div className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200 md:text-sm">
            Weber Sprint · two weeks only · ends June 17
          </div>
          <h1 className="display-tight mt-5 font-display text-4xl tracking-tight md:text-6xl">
            Your Weber, cooking like new again.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-bone/80">
            Send us a photo of your Weber and we&apos;ll send back an honest quote with your discount already in it.
            <strong className="text-bone"> 15% off solo, 30% if you split a visit with a neighbor.</strong> You pay
            online and pick the day — we text to lock the window.
          </p>
          {active ? (
            <div className="mt-8 flex flex-col items-center gap-4">
              <FathersDayCountdown endISO={WEBER_SPRINT.endISO} />
              <a href="#book" className="rounded-md bg-burgundy px-6 py-3 text-sm font-semibold uppercase tracking-wider text-bone hover:bg-burgundy-700">
                Get my honest quote →
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
            <WeberThermometer count={cleanedCount} target={WEBER_SPRINT.milestone.target} teaseText={WEBER_SPRINT.milestone.teaseText} />
            <div className="rounded-2xl border border-border bg-white p-6 text-sm text-ink/75 space-y-3">
              <h2 className="font-display text-lg text-navy">How it works</h2>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Snap a photo of your Weber, and tell us the model.</li>
                <li>Get an honest quote — real number, discount already applied, no upsell.</li>
                <li>Pay and pick your day. We text to confirm your window.</li>
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
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-ink/60">
              Every one is a real local job — photographed before we touched it and after we finished.
            </p>
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
                      <p className="font-medium text-navy">{j.grillModel} · {j.neighborhood}</p>
                      {CAPTIONS[j.id] && <p className="mt-0.5 text-ink/60">{CAPTIONS[j.id]}</p>}
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
        <p className="text-[11px] uppercase tracking-widest text-burgundy">From the crew</p>
        <p className="mt-3 text-ink/80">
          Weber builds a grill worth keeping for 15+ years — but only if it&apos;s cared for. For the next two weeks
          we&apos;re on a mission to get as many local Webers cooking like new again before summer hits full swing.
          Book yours, grab a neighbor, and let&apos;s get them clean.
        </p>
        <p className="mt-3 font-display text-lg text-navy">— Tri-State Grill Cleaning</p>
      </section>
    </div>
  );
}
