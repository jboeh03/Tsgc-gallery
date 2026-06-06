import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { isWeberSprintActive, WEBER_SPRINT } from "@/lib/campaign-weber";
import { WEBER_REPAIR_GUIDES } from "@/lib/weber-repair-guides";

/**
 * Evergreen, INDEXABLE SEO page targeting Weber repair / parts searches
 * (igniter, flavorizer bars, burner tubes, cooking grates, regulator) for the
 * Cincinnati / NKY / Dayton area. Funnels that high-intent traffic to /quote
 * and — while the sprint is live — the /weber offer. Unlike /weber, this page
 * is meant to rank, so it is index:true and carries FAQ structured data.
 */

const TITLE = "Weber Grill Repair & Parts — Cincinnati, NKY & Dayton";
const DESCRIPTION =
  "We repair and restore Weber gas grills across Greater Cincinnati — igniters, burner tubes, flavorizer bars, cooking grates and more — then deep-clean it in the same visit. Free photo quote.";

export const metadata: Metadata = {
  title: `${TITLE} | ${SITE.name}`,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.canonicalUrl}/weber-grill-repair` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: `${SITE.canonicalUrl}/weber-grill-repair`,
  },
};

const REPAIRS = [
  {
    h: "Weber igniter not sparking",
    p: "A dead igniter is the #1 Weber complaint — and usually the cheapest fix. We replace the igniter, battery, electrode and collector box so it lights on the first click again.",
  },
  {
    h: "Burner tubes rusted or uneven flames",
    p: "Clogged or corroded stainless burner tubes give you cold spots and flare-ups. We clear, test, and replace burner tubes so heat is even edge to edge.",
  },
  {
    h: "Flavorizer bars burned through",
    p: "Rusted-through flavorizer bars drop grease straight onto the burners. We swap in fresh Weber-fit flavorizer bars and protect the burners underneath.",
  },
  {
    h: "Cooking grates worn or flaking",
    p: "Pitted, peeling grates ruin sear marks and stick. We replace cast-iron or stainless cooking grates and season them right.",
  },
  {
    h: "Low flame, gas flow & regulator issues",
    p: "If your Weber won't get past 300°F, it's often a tripped regulator or a leaky hose. We diagnose the gas train, reset or replace the regulator, and leak-check every fitting.",
  },
  {
    h: "Grease fires, rust-through & deep buildup",
    p: "Years of carbon and grease aren't just ugly — they're a fire risk. Our deep clean strips the cookbox, lid and drip system back to safe, working metal.",
  },
];

const FAQ = [
  {
    q: "Is it worth repairing my Weber instead of replacing it?",
    a: "Almost always yes. A Weber Genesis or Spirit is built to last 15+ years, and most problems — igniter, burner tubes, flavorizer bars, grates — are wear parts that cost a fraction of a new grill. We'll tell you honestly if yours isn't worth saving.",
  },
  {
    q: "Do you replace Weber igniters and burner parts?",
    a: "Yes. We repair and replace Weber igniters, electrodes, burner tubes, flavorizer bars, cooking grates, regulators and hoses, then deep-clean the grill in the same visit so it looks and runs like new.",
  },
  {
    q: "How much does Weber grill repair cost in Cincinnati?",
    a: "It depends on which parts are needed and the grill's condition. Send us a photo and we'll give you a free, honest quote — often the repair plus a full deep clean is far less than a replacement grill.",
  },
  {
    q: "What areas do you serve?",
    a: "We service Weber grills across Greater Cincinnati, Northern Kentucky and Dayton. We come to you — no need to haul the grill anywhere.",
  },
  {
    q: "Can you clean my Weber at the same time as the repair?",
    a: "Yes — that's our specialty. Every repair visit includes a deep clean of the cookbox, grates, flavorizer bars and drip system, so you get a grill that both works and looks like the day you bought it.",
  },
];

export default function WeberRepairPage() {
  const sprint = isWeberSprintActive();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="bg-bone">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Hero */}
      <section className="bg-navy text-bone">
        <div className="mx-auto max-w-4xl px-5 py-16 md:py-20">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-burgundy-400">
            Weber Specialists · Cincinnati · NKY · Dayton
          </p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl leading-tight">
            Weber Grill Repair &amp; Parts Replacement
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-bone/85 leading-relaxed">
            Igniter won&apos;t spark? Burners rusted out? Flavorizer bars done?
            We repair and restore Weber gas grills across Greater Cincinnati —
            and deep-clean them in the same visit. Before you buy a new grill,
            send us a photo.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/quote"
              className="rounded-md bg-burgundy text-bone px-7 py-3.5 text-sm font-semibold uppercase tracking-widest hover:bg-burgundy-400 shadow"
            >
              Get a free repair quote →
            </Link>
            <a
              href={SITE.phoneHref}
              className="rounded-md border border-bone/30 px-7 py-3.5 text-sm font-semibold uppercase tracking-widest hover:bg-bone/10"
            >
              ☎ {SITE.phone}
            </a>
          </div>
        </div>
      </section>

      {/* Sprint callout (only while live) */}
      {sprint ? (
        <section className="bg-burgundy text-bone">
          <div className="mx-auto max-w-4xl px-5 py-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium">
              🔥 <span className="font-semibold text-amber-200">Weber Sprint:</span>{" "}
              {WEBER_SPRINT.discount.base}% off any Weber deep clean right now —{" "}
              {WEBER_SPRINT.discount.neighbor}% with a neighbor.
            </p>
            <Link
              href={WEBER_SPRINT.landingPath}
              className="text-sm font-semibold uppercase tracking-widest text-amber-200 underline underline-offset-4 hover:text-amber-100"
            >
              See the deal →
            </Link>
          </div>
        </section>
      ) : null}

      {/* Common repairs */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="font-display text-3xl text-navy">Common Weber repairs we handle</h2>
        <p className="mt-3 max-w-2xl text-ink/80">
          Spirit, Genesis, Summit and Q — gas or charcoal. If it&apos;s a Weber, we know it.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {REPAIRS.map((r) => (
            <div key={r.h} className="rounded-xl border border-border bg-white p-6">
              <h3 className="font-display text-xl text-navy">{r.h}</h3>
              <p className="mt-2 text-ink/80 leading-relaxed">{r.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Specific fix guides (cluster spokes) */}
      <section className="bg-white border-y border-border">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <h2 className="font-display text-3xl text-navy">Common Weber fixes</h2>
          <p className="mt-3 max-w-2xl text-ink/80">
            Searching a specific problem? Start here — then send a photo for a free quote.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WEBER_REPAIR_GUIDES.map((g) => (
              <Link
                key={g.slug}
                href={`/weber-grill-repair/${g.slug}`}
                className="rounded-xl border border-border bg-bone/40 p-5 hover:border-burgundy"
              >
                <p className="font-display text-lg text-navy">{g.model}</p>
                <p className="mt-1 text-sm text-burgundy font-semibold">{g.topic}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Repair + clean positioning */}
      <section className="bg-white border-y border-border">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center">
          <h2 className="font-display text-3xl text-navy">
            Repair <span className="text-burgundy">and</span> deep clean — one visit
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-ink/80 leading-relaxed">
            Anyone can sell you parts. We come to your home, fix what&apos;s broken, and
            strip away years of grease and carbon so your Weber is safe, even-heating and
            looks showroom-new — without you lifting a wrench. See the difference in our{" "}
            <Link href="/gallery" className="text-burgundy underline underline-offset-4">
              before &amp; after gallery
            </Link>
            .
          </p>
          <Link
            href="/quote"
            className="inline-block mt-7 rounded-md bg-burgundy text-bone px-8 py-4 text-sm font-semibold uppercase tracking-widest hover:bg-burgundy-400 shadow"
          >
            Send a photo, get a quote
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-5 py-16">
        <h2 className="font-display text-3xl text-navy">Weber repair questions</h2>
        <dl className="mt-8 space-y-6">
          {FAQ.map((f) => (
            <div key={f.q} className="rounded-xl border border-border bg-white p-6">
              <dt className="font-semibold text-navy">{f.q}</dt>
              <dd className="mt-2 text-ink/80 leading-relaxed">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Final CTA */}
      <section className="bg-navy text-bone">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <h2 className="font-display text-3xl md:text-4xl">Bring your Weber back to life</h2>
          <p className="mt-3 text-bone/80">
            Free quote, honest answer, and a grill that works like new. Cincinnati, NKY &amp; Dayton.
          </p>
          <Link
            href="/quote"
            className="inline-block mt-6 rounded-md bg-burgundy text-bone px-8 py-4 text-sm font-semibold uppercase tracking-widest hover:bg-burgundy-400 shadow"
          >
            Get my free quote →
          </Link>
        </div>
      </section>
    </div>
  );
}
