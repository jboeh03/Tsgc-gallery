import type { Metadata } from "next";
import Link from "next/link";
import { CAMPAIGN, isCampaignActive } from "@/lib/campaign";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `Memorial Day 2026 — Save up to 30% | ${SITE.name}`,
  description:
    "A veteran-founded thank-you from Tri-State Grill Cleaning. Three Memorial Day offers — 10% off any cleaning, 30% off when you book with a neighbor, 20% off parts and repair. Book by May 25.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Memorial Day 2026 — Up to 30% off grill cleaning",
    description:
      "Veteran-founded crew, three ways to save through Memorial Day weekend.",
    type: "website",
  },
};

export default function MemorialDayPage() {
  const active = isCampaignActive();
  const tiers = CAMPAIGN.tiers;

  return (
    <div className="bg-bone">
      {/* Hero band — burgundy gradient, no photo, typography-led */}
      <section className="relative overflow-hidden bg-gradient-to-br from-burgundy-700 via-burgundy to-burgundy-700 text-bone">
        <div className="mx-auto max-w-4xl px-5 py-20 md:py-24 text-center">
          <div className="text-xs md:text-sm uppercase tracking-[0.35em] text-amber-200 font-semibold">
            Memorial Day · 2026
          </div>
          <div className="mt-5 mx-auto w-12 h-[3px] rounded-full bg-amber-300/80" />
          <h1 className="mt-6 font-display text-4xl md:text-6xl leading-tight tracking-tight">
            Honor the Weekend.
            <br />
            Fire Up the Grill.
          </h1>
          <p className="mt-6 mx-auto max-w-2xl text-base md:text-lg text-amber-50/90 leading-relaxed">
            A veteran-founded thank-you from Tri-State —
            three ways to save before Memorial Day.
          </p>
          {active ? (
            <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-burgundy-700/70 ring-1 ring-amber-200/40 px-4 py-2 text-sm">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
              <span className="text-amber-100">
                Offers end {CAMPAIGN.longDeadline.replace("midnight on ", "midnight · ")}
              </span>
            </div>
          ) : (
            <div className="mt-8 inline-flex items-center rounded-full bg-burgundy-700/70 ring-1 ring-amber-200/40 px-4 py-2 text-sm text-amber-100">
              These Memorial Day offers have ended — see current pricing on our quote page.
            </div>
          )}
        </div>
      </section>

      {/* Meaning paragraph */}
      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-5 py-14 md:py-16 text-center">
          <p className="font-display text-2xl md:text-3xl text-navy leading-snug">
            Memorial Day isn&apos;t a marketing holiday.
            It&apos;s a day to remember.
          </p>
          <p className="mt-6 text-base md:text-lg text-ink/90 leading-relaxed">
            We&apos;ll be thinking about the men and women who never made it home.
            We&apos;ll also be doing what they fought for — spending the day with family,
            around a grill, in a backyard that feels like home.
          </p>
          <p className="mt-4 text-base md:text-lg text-ink/90 leading-relaxed">
            Whatever your weekend looks like, we want yours to be spotless.
            Through {CAMPAIGN.shortDeadline}, here are three ways we&apos;re saying thanks.
          </p>
        </div>
      </section>

      {/* Three offer tier cards */}
      <section className="bg-bone">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((t) => (
              <OfferCard key={t.id} tier={t} active={active} />
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted">
            All offers require booking <strong>and</strong> payment before{" "}
            {CAMPAIGN.longDeadline}.
            The actual cleaning can be scheduled whenever works for you.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-border">
        <div className="mx-auto max-w-5xl px-5 py-14 md:py-16">
          <h2 className="font-display text-2xl md:text-3xl text-navy text-center">
            How it works
          </h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
            <Step
              n={1}
              title="Pick your deal"
              body="Click the offer above that fits. We pre-fill the promo code on the quote form for you."
            />
            <Step
              n={2}
              title="Tell us when"
              body={`Book and pay before ${CAMPAIGN.shortDeadline}. Schedule the actual cleaning for any date that works for you.`}
            />
            <Step
              n={3}
              title="We come to you"
              body="Veteran-owned, locally operated. Spotless grill, ready to fire up — every time."
            />
          </div>
        </div>
      </section>

      {/* Jeff's sign-off */}
      <section className="bg-bone">
        <div className="mx-auto max-w-3xl px-5 py-16 md:py-20">
          <div className="rounded-lg bg-white border border-border p-8 md:p-10 shadow-sm">
            <div className="text-xs uppercase tracking-widest text-burgundy font-semibold">
              A note from the founder
            </div>
            <p className="mt-4 text-base md:text-lg text-ink leading-relaxed">
              I started Tri-State after my time in service because I wanted to keep building
              something with my hands and serving my community. If we can make your Memorial Day
              weekend a little easier — and a little more about the people around the table —
              that&apos;s the whole point.
            </p>
            <p className="mt-4 text-base md:text-lg text-ink leading-relaxed">
              Thanks for trusting us with it.
            </p>
            <p className="mt-6 font-display text-lg text-navy">— Jeff</p>
            <p className="text-sm text-muted">
              {SITE.name} · Veteran-Founded · Cincinnati · NKY · Dayton
            </p>
          </div>
        </div>
      </section>

      {/* Urgency strip */}
      {active ? (
        <section className="bg-navy text-bone">
          <div className="mx-auto max-w-6xl px-5 py-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center">
            <span className="text-xs sm:text-sm tracking-widest uppercase text-amber-200/90">
              ⏰ Offers end {CAMPAIGN.longDeadline}
            </span>
            <Link
              href={`/quote?promo=${CAMPAIGN.tiers[1].code}`}
              className="text-xs sm:text-sm tracking-widest uppercase font-semibold underline underline-offset-4 hover:text-amber-200"
            >
              Claim a deal &rarr;
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function OfferCard({
  tier,
  active,
}: {
  tier: (typeof CAMPAIGN.tiers)[number];
  active: boolean;
}) {
  const featured = tier.featured;
  return (
    <div
      className={`relative flex flex-col rounded-xl bg-white p-7 shadow-sm transition ${
        featured
          ? "ring-2 ring-amber-400 md:scale-105 shadow-lg"
          : "ring-1 ring-border hover:ring-burgundy/30"
      }`}
    >
      {featured ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-navy">
          Best Value
        </div>
      ) : null}
      <div className="text-xs uppercase tracking-widest text-burgundy font-semibold">
        {tier.label}
      </div>
      <div className="mt-4 font-display text-5xl md:text-6xl text-navy leading-none">
        {tier.percent}%
        <span className="text-xl md:text-2xl ml-1 text-burgundy align-top">
          off
        </span>
      </div>
      <p className="mt-4 text-sm text-ink leading-relaxed flex-1">
        {tier.blurb}
      </p>
      <div className="mt-5 rounded-md bg-bone px-3 py-2 text-center">
        <span className="text-[11px] uppercase tracking-widest text-muted">Code</span>
        <div className="font-mono text-sm font-semibold text-navy tracking-wider">
          {tier.code}
        </div>
      </div>
      {active ? (
        <Link
          href={`/quote?promo=${tier.code}`}
          className={`mt-5 inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-semibold uppercase tracking-widest transition ${
            featured
              ? "bg-burgundy text-bone hover:bg-burgundy-400 shadow"
              : "bg-navy text-bone hover:bg-navy-700"
          }`}
        >
          Book This Deal &rarr;
        </Link>
      ) : (
        <div className="mt-5 rounded-md bg-gray-100 px-5 py-3 text-center text-sm text-muted">
          Offer ended
        </div>
      )}
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-burgundy text-bone flex items-center justify-center font-display text-xl">
        {n}
      </div>
      <h3 className="mt-4 font-display text-lg text-navy uppercase tracking-wide">
        {title}
      </h3>
      <p className="mt-2 text-sm text-ink/80 leading-relaxed">{body}</p>
    </div>
  );
}
