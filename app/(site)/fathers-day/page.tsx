import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FATHERS_DAY, isFathersDayActive } from "@/lib/campaign-fathers-day";
import { SITE } from "@/lib/site";
import FathersDayCountdown from "@/components/FathersDayCountdown";

export const metadata: Metadata = {
  title: `Father's Day 2026 — Treat Dad to a Spotless Grill | ${SITE.name}`,
  description:
    "Give Dad the grill he forgot he had. Three Father's Day offers from veteran-founded Tri-State Grill Cleaning — 20% off any cleaning, 30% off clean + repair, or a gift card with a bonus grill brush. Book by June 21.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Father's Day 2026 — Treat Dad to a spotless grill",
    description:
      "Veteran-founded crew, three ways to gift Dad a like-new grill this Father's Day.",
    type: "website",
  },
};

export default function FathersDayPage() {
  const active = isFathersDayActive();
  const tiers = FATHERS_DAY.tiers;
  const featured = tiers.find((t) => t.featured) ?? tiers[0];

  return (
    <div className="bg-bone">
      {/* ── VIDEO-READY HERO ──────────────────────────────────────────────
          A <video> with a gallery after-image as poster. Swap the source for
          the generated Father's Day motion video when it's ready. */}
      <section className="relative overflow-hidden bg-navy-900 text-bone">
        {/* Background media layer */}
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
            {/* Higgsfield (Seedance 2.0) image-to-video hero, generated from a real after-shot. */}
            <source src="/fathers-day-hero.mp4" type="video/mp4" />
          </video>
          {/* Smoke-and-fire wash: navy anchor + a burgundy ember from below */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/85 to-navy-900/55"
            aria-hidden="true"
          />
          <div
            className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-burgundy-700/55 to-transparent mix-blend-multiply"
            aria-hidden="true"
          />
        </div>

        {/* Hero content */}
        <div className="relative mx-auto max-w-4xl px-5 py-24 text-center md:py-32">
          <div className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200 md:text-sm">
            Father&apos;s Day · June 21, 2026
          </div>
          <div className="mx-auto mt-5 h-[3px] w-12 rounded-full bg-amber-300/80" />
          <h1 className="display-tight mt-6 font-display text-4xl tracking-tight md:text-6xl">
            Give Dad the Grill
            <br />
            He Forgot He Had.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-bone/85 md:text-lg">
            Skip another tie. This year, hand him back a grill that looks — and
            cooks — like the day he bought it. Veteran-founded, we come to you.
          </p>

          {active ? (
            <>
              <div className="mt-10">
                <FathersDayCountdown endISO={FATHERS_DAY.endISO} />
              </div>
              <p className="mt-4 text-xs uppercase tracking-widest text-bone/55">
                Until offers end · {FATHERS_DAY.shortDeadline}
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={`/quote?promo=${featured.code}`}
                  className="inline-flex items-center justify-center rounded-md bg-burgundy px-7 py-3.5 text-sm font-semibold uppercase tracking-widest text-bone shadow transition hover:bg-burgundy-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  Treat Dad &rarr;
                </Link>
                <a
                  href="#offers"
                  className="inline-flex items-center justify-center rounded-md px-5 py-3.5 text-sm font-semibold uppercase tracking-widest text-bone/90 underline underline-offset-4 transition hover:text-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  See all three offers
                </a>
              </div>
            </>
          ) : (
            <div className="mt-10 inline-flex items-center rounded-full bg-navy-900/50 px-4 py-2 text-sm text-amber-100 ring-1 ring-amber-200/40">
              These Father&apos;s Day offers have ended — see current pricing on
              our quote page.
            </div>
          )}
        </div>
      </section>

      {/* ── GIFTING ANGLE ─────────────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-5 py-14 text-center md:py-16">
          <p className="font-display text-2xl leading-snug text-navy md:text-3xl">
            The dads in your life don&apos;t want more stuff.
          </p>
          <p className="mt-6 text-base leading-relaxed text-ink/90 md:text-lg">
            They want a Saturday that works. A grill that lights on the first
            try, grates that don&apos;t flake, and burgers that taste like summer
            — not last season&apos;s grease. That&apos;s a gift he&apos;ll use
            every weekend until fall.
          </p>
          <p className="mt-4 text-base leading-relaxed text-ink/90 md:text-lg">
            Through {FATHERS_DAY.shortDeadline}, here are three ways to make it
            happen.
          </p>
        </div>
      </section>

      {/* ── THREE OFFER TIERS ─────────────────────────────────────────────── */}
      <section id="offers" className="scroll-mt-8 bg-bone">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-16">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {tiers.map((t) => (
              <OfferCard key={t.id} tier={t} active={active} />
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted">
            All offers require booking <strong>and</strong> payment before{" "}
            {FATHERS_DAY.longDeadline}. The cleaning itself can be scheduled for
            any date that works — including after the big day.
          </p>
        </div>
      </section>

      {/* ── PROOF / WHY-US STRIP ──────────────────────────────────────────── */}
      <section className="border-y border-border bg-white">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-16">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
            {/* Real before / after proof */}
            <div className="grid grid-cols-2 gap-3">
              <ProofImage
                src="/gallery/tsg-016-before.webp"
                alt="A grease-caked grill grate before a Tri-State deep clean"
                tag="Before"
                tagClass="bg-burgundy text-bone"
              />
              <ProofImage
                src="/gallery/tsg-016-after.webp"
                alt="The same grill grate, restored and spotless after cleaning"
                tag="After"
                tagClass="bg-navy text-bone"
              />
            </div>
            {/* Why us */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-burgundy">
                Why dads (and their families) trust us
              </div>
              <h2 className="mt-3 font-display text-2xl leading-snug text-navy md:text-3xl">
                Not a franchise. A neighbor who served.
              </h2>
              <ul className="mt-6 space-y-4">
                <Reason
                  title="Veteran-founded, locally run"
                  body="Jason served, then built this with his own hands. Jeff runs the day-to-day now — you still deal with the owners, not a call center."
                />
                <Reason
                  title="We come to you"
                  body="Cincinnati, Northern Kentucky, and Dayton. No hauling the grill anywhere — we set up in the driveway."
                />
                <Reason
                  title="Real before-and-afters, every job"
                  body="Photos like the ones above aren't staged. That's the standard on every grill we touch."
                />
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOUNDER NOTE ──────────────────────────────────────────────────── */}
      <section className="bg-bone">
        <div className="mx-auto max-w-3xl px-5 py-16 md:py-20">
          <div className="rounded-xl border border-border bg-white p-8 shadow-sm md:p-10">
            <div className="text-xs font-semibold uppercase tracking-widest text-burgundy">
              A note from the founder
            </div>
            <p className="mt-4 text-base leading-relaxed text-ink md:text-lg">
              My own dad taught me that a job worth doing is worth doing right —
              and that the best gift is usually time, not stuff. So if I can take
              the worst chore off your dad&apos;s plate and hand him back a grill
              he&apos;s proud to cook on, that&apos;s a Father&apos;s Day done
              right.
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink md:text-lg">
              Thanks for trusting us with it.
            </p>
            <p className="mt-6 font-display text-lg text-navy">— Jason, founder</p>
            <p className="text-sm text-muted">
              {SITE.name} · Veteran-Founded · Cincinnati · NKY · Dayton
            </p>
          </div>
        </div>
      </section>

      {/* ── URGENCY STRIP ─────────────────────────────────────────────────── */}
      {active ? (
        <section className="bg-navy text-bone">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-5 py-5 text-center">
            <span className="text-xs uppercase tracking-widest text-amber-200/90 sm:text-sm">
              Offers end {FATHERS_DAY.longDeadline}
            </span>
            <Link
              href={`/quote?promo=${featured.code}`}
              className="text-xs font-semibold uppercase tracking-widest underline underline-offset-4 transition hover:text-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 sm:text-sm"
            >
              Treat Dad &rarr;
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
  tier: (typeof FATHERS_DAY.tiers)[number];
  active: boolean;
}) {
  const featured = tier.featured;
  const isGift = tier.percent === 0;
  return (
    <div
      className={`relative flex flex-col rounded-xl bg-white p-7 shadow-sm transition ${
        featured
          ? "shadow-lg ring-2 ring-amber-400 md:scale-105"
          : "ring-1 ring-border hover:ring-burgundy/30"
      }`}
    >
      {featured ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-navy">
          Best Value
        </div>
      ) : null}
      <div className="text-xs font-semibold uppercase tracking-widest text-burgundy">
        {tier.label}
      </div>

      {isGift ? (
        <div className="mt-4 font-display text-3xl leading-tight text-navy md:text-[2rem]">
          Gift card
          <span className="ml-1 align-top text-lg text-burgundy md:text-xl">
            + a brush
          </span>
        </div>
      ) : (
        <div className="mt-4 font-display text-5xl leading-none text-navy md:text-6xl">
          {tier.percent}%
          <span className="ml-1 align-top text-xl text-burgundy md:text-2xl">
            off
          </span>
        </div>
      )}

      <p className="mt-4 flex-1 text-sm leading-relaxed text-ink">{tier.blurb}</p>

      <div className="mt-5 rounded-md bg-bone px-3 py-2 text-center">
        <span className="text-[11px] uppercase tracking-widest text-muted">
          Code
        </span>
        <div className="font-mono text-sm font-semibold tracking-wider text-navy">
          {tier.code}
        </div>
      </div>

      {active ? (
        <Link
          href={`/quote?promo=${tier.code}`}
          className={`mt-5 inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-semibold uppercase tracking-widest transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
            featured
              ? "bg-burgundy text-bone shadow hover:bg-burgundy-400"
              : "bg-navy text-bone hover:bg-navy-700"
          }`}
        >
          {isGift ? "Gift This" : "Book This Deal"} &rarr;
        </Link>
      ) : (
        <div className="mt-5 rounded-md bg-gray-100 px-5 py-3 text-center text-sm text-muted">
          Offer ended
        </div>
      )}
    </div>
  );
}

function ProofImage({
  src,
  alt,
  tag,
  tagClass,
}: {
  src: string;
  alt: string;
  tag: string;
  tagClass: string;
}) {
  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-border">
      <Image src={src} alt={alt} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
      <span
        className={`absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${tagClass}`}
      >
        {tag}
      </span>
    </div>
  );
}

function Reason({ title, body }: { title: string; body: string }) {
  return (
    <li className="flex gap-3">
      <span
        className="mt-1.5 h-2 w-2 flex-none rounded-full bg-amber-400"
        aria-hidden="true"
      />
      <div>
        <div className="font-display text-base uppercase tracking-wide text-navy">
          {title}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-ink/80">{body}</p>
      </div>
    </li>
  );
}
