import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getJobs } from "@/lib/jobs";
import { SITE } from "@/lib/site";
import { MULTI_GRILL, isMultiGrillActive } from "@/lib/campaign-multi-grill";
import FathersDayCountdown from "@/components/FathersDayCountdown";

export const metadata: Metadata = {
  title: `Multi-Grill Weekend — up to 25% off a whole-collection clean | ${SITE.name}`,
  description:
    "Got more than one grill? Book two or more at one address and save — 10% off one, 15% off two, 25% off three or more. Every brand and type: gas, pellet smokers, griddles, Weber, Traeger, Blackstone.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Multi-Grill Weekend — up to 25% off a whole-collection clean",
    description:
      "One visit, one crew, every grill done. Book two or more grills at one address and save through Sunday.",
    type: "website",
  },
};

export default async function MultiGrillPage() {
  const active = isMultiGrillActive();
  const jobs = await getJobs();
  const proof = jobs.filter((j) => j.pairs?.length).slice(0, 4);
  const tiers = MULTI_GRILL.tiers;
  const featured = tiers.find((t) => t.featured) ?? tiers[0];

  return (
    <div className="bg-bone">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-navy text-bone">
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
            className="absolute inset-0 bg-gradient-to-t from-navy via-navy/85 to-navy/60"
            aria-hidden="true"
          />
          <div
            className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-burgundy-700/55 to-transparent mix-blend-multiply"
            aria-hidden="true"
          />
        </div>

        <div className="relative mx-auto max-w-4xl px-5 py-24 text-center md:py-32">
          <div className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200 md:text-sm">
            Multi-Grill Weekend · ends {MULTI_GRILL.shortDeadline}
          </div>
          <div className="mx-auto mt-5 h-[3px] w-12 rounded-full bg-amber-300/80" />
          <h1 className="display-tight mt-6 font-display text-4xl tracking-tight md:text-6xl">
            More than one grill?
            <br />
            Clean the whole lineup.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-bone/85 md:text-lg">
            Grill, smoker, and griddle sitting side by side? We&apos;ll do them all in one
            visit — <strong className="text-bone">10% off one, 15% off two, 25% off three or more</strong> at
            the same address. Every brand and type: Weber, Traeger, Blackstone, gas,
            pellet, you name it.
          </p>

          {active ? (
            <>
              <div className="mt-10">
                <FathersDayCountdown endISO={MULTI_GRILL.endISO} />
              </div>
              <p className="mt-4 text-xs uppercase tracking-widest text-bone/55">
                Book by {MULTI_GRILL.shortDeadline}
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={`/quote?promo=${featured.code}`}
                  className="inline-flex items-center justify-center rounded-md bg-burgundy px-7 py-3.5 text-sm font-semibold uppercase tracking-widest text-bone shadow transition hover:bg-burgundy-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  Get my quote &rarr;
                </Link>
                <a
                  href="#offers"
                  className="inline-flex items-center justify-center rounded-md px-5 py-3.5 text-sm font-semibold uppercase tracking-widest text-bone/90 underline underline-offset-4 transition hover:text-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  See the savings
                </a>
              </div>
            </>
          ) : (
            <div className="mt-10 inline-flex items-center rounded-full bg-navy/50 px-4 py-2 text-sm text-amber-100 ring-1 ring-amber-200/40">
              Multi-Grill Weekend has ended — but we&apos;d still love to clean your
              lineup. See current pricing on our quote page.
            </div>
          )}
        </div>
      </section>

      {/* ── THE PITCH ────────────────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-5 py-14 text-center md:py-16">
          <p className="font-display text-2xl leading-snug text-navy md:text-3xl">
            One address. One trip. Every grill done.
          </p>
          <p className="mt-6 text-base leading-relaxed text-ink/90 md:text-lg">
            When we can knock out two, three, or more grills in a single visit, we save
            on drive time — and we hand that savings straight back to you. Doesn&apos;t
            matter if it&apos;s a gas grill, a pellet smoker, and a flat-top griddle all
            in a row. If it cooks food, we&apos;ll bring it back to life.
          </p>
          <p className="mt-4 text-base leading-relaxed text-ink/90 md:text-lg">
            Just inherited a lineup with a new house? That&apos;s exactly what this is
            for. Send us photos and we&apos;ll quote the whole set at once.
          </p>
        </div>
      </section>

      {/* ── OFFER TIERS ──────────────────────────────────────────────────── */}
      <section id="offers" className="scroll-mt-8 bg-bone">
        <div className="mx-auto max-w-5xl px-5 py-14 md:py-16">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {tiers.map((t) => (
              <OfferCard key={t.id} tier={t} active={active} />
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted">
            Discount applies to grills booked for one address by{" "}
            {MULTI_GRILL.longDeadline}. The cleaning itself can be scheduled for any
            date that works. Neighbors can split a two-grill visit too — just book
            together.
          </p>
        </div>
      </section>

      {/* ── PROOF ────────────────────────────────────────────────────────── */}
      {proof.length > 0 && (
        <section className="border-y border-border bg-white">
          <div className="mx-auto max-w-5xl px-5 py-14 md:py-16">
            <h2 className="text-center font-display text-2xl text-navy">
              Real grills we&apos;ve brought back
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-ink/60">
              Every one is a real local job — photographed before we touched it and
              after we finished.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {proof.map((j) => {
                const pair = j.pairs[0];
                if (!pair) return null;
                return (
                  <div
                    key={j.id}
                    className="overflow-hidden rounded-xl border border-border"
                  >
                    <div className="grid grid-cols-2">
                      <div className="relative aspect-[4/3]">
                        <Image
                          src={pair.before}
                          alt={pair.beforeAlt || "Before"}
                          fill
                          className="object-cover"
                          sizes="(max-width:640px) 50vw, 25vw"
                        />
                        <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white">
                          Before
                        </span>
                      </div>
                      <div className="relative aspect-[4/3]">
                        <Image
                          src={pair.after}
                          alt={pair.afterAlt || "After"}
                          fill
                          className="object-cover"
                          sizes="(max-width:640px) 50vw, 25vw"
                        />
                        <span className="absolute left-2 top-2 rounded bg-burgundy px-2 py-0.5 text-[10px] uppercase tracking-wider text-bone">
                          After
                        </span>
                      </div>
                    </div>
                    <div className="px-4 py-3 text-sm">
                      <p className="font-medium text-navy">
                        {j.grillModel}
                        {j.neighborhood ? ` · ${j.neighborhood}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-8 text-center text-sm text-ink/60">
              Every brand welcome —{" "}
              <a
                href="/quote"
                className="text-burgundy underline hover:text-burgundy-700"
              >
                get a free quote for any grill &rarr;
              </a>
            </p>
          </div>
        </section>
      )}

      {/* ── FOUNDER NOTE ─────────────────────────────────────────────────── */}
      <section className="bg-bone">
        <div className="mx-auto max-w-3xl px-5 py-16 md:py-20">
          <div className="rounded-xl border border-border bg-white p-8 shadow-sm md:p-10">
            <div className="text-xs font-semibold uppercase tracking-widest text-burgundy">
              From the crew
            </div>
            <p className="mt-4 text-base leading-relaxed text-ink md:text-lg">
              Some of our favorite jobs are the ones where a whole backyard has been
              let go — a grill, a smoker, a griddle, all sitting under a cover for a
              couple seasons. We love bringing the entire setup back in one afternoon.
              If that&apos;s you, this weekend is the one to book it.
            </p>
            <p className="mt-6 font-display text-lg text-navy">
              — {SITE.name}
            </p>
            <p className="text-sm text-muted">
              Veteran-Founded · Cincinnati · NKY · Dayton
            </p>
          </div>
        </div>
      </section>

      {/* ── URGENCY STRIP ────────────────────────────────────────────────── */}
      {active ? (
        <section className="bg-navy text-bone">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-5 py-5 text-center">
            <span className="text-xs uppercase tracking-widest text-amber-200/90 sm:text-sm">
              Multi-Grill Weekend ends {MULTI_GRILL.longDeadline}
            </span>
            <Link
              href={`/quote?promo=${featured.code}`}
              className="text-xs font-semibold uppercase tracking-widest underline underline-offset-4 transition hover:text-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 sm:text-sm"
            >
              Get my quote &rarr;
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
  tier: (typeof MULTI_GRILL.tiers)[number];
  active: boolean;
}) {
  const featured = tier.featured;
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
        {tier.count}
      </div>
      <div className="mt-4 font-display text-5xl leading-none text-navy md:text-6xl">
        {tier.percent}%
        <span className="ml-1 align-top text-xl text-burgundy md:text-2xl">off</span>
      </div>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-ink">{tier.blurb}</p>

      <div className="mt-5 rounded-md bg-bone px-3 py-2 text-center">
        <span className="text-[11px] uppercase tracking-widest text-muted">Code</span>
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
