import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing · Tri-State Grill Cleaning",
  description:
    "Flat-rate, quote-first pricing for grill deep-cleanings in Cincinnati, NKY, and Dayton.",
};

type Tier = {
  name: string;
  startingAt: string;
  match: string;
  bullets: string[];
  featured?: boolean;
};

const TIERS: Tier[] = [
  {
    name: "Standard Cart",
    startingAt: "$199",
    match: "Most freestanding gas, charcoal, and pellet grills.",
    bullets: [
      "Full teardown and degrease",
      "Burner and ignitor inspection",
      "Stainless polish",
      "Service report + photos",
    ],
  },
  {
    name: "Premium Cart",
    startingAt: "$279",
    match: "Larger 4-burner+ carts, kamados, and higher-end pellet smokers.",
    bullets: [
      "Everything in Standard",
      "Side-burner and sear-burner service",
      "Rotisserie kit clean (if equipped)",
      "Gasket / vent inspection on kamados",
    ],
    featured: true,
  },
  {
    name: "Built-In Island",
    startingAt: "$399",
    match: "Built-ins serviced in place — Lynx, DCS, Hestan, Alfresco, Coyote.",
    bullets: [
      "On-site service, no removal",
      "Hood polish to factory finish",
      "Infrared / sear burner clean",
      "Gas leak-check on completion",
    ],
  },
];

export default function PricingPage() {
  return (
    <>
      <section className="bg-navy text-bone">
        <div className="mx-auto max-w-5xl px-5 py-16 md:py-20">
          <p className="uppercase tracking-widest text-burgundy-400 text-xs font-semibold">
            Pricing
          </p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl">
            Flat-rate, quoted up front.
          </h1>
          <p className="mt-5 text-lg text-bone/85 max-w-2xl">
            We give you the full price after you send a few photos. Tiers below
            are starting points — most jobs land within $20–40 of the published
            number.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 md:py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-xl p-7 shadow-sm border ${
                t.featured
                  ? "bg-navy text-bone border-burgundy"
                  : "bg-white text-ink border-navy/10"
              }`}
            >
              {t.featured ? (
                <span className="absolute -top-3 left-7 inline-block bg-burgundy text-bone text-xs uppercase tracking-widest px-3 py-1 rounded-full font-semibold">
                  Most booked
                </span>
              ) : null}
              <p
                className={`uppercase tracking-widest text-xs font-semibold ${
                  t.featured ? "text-burgundy-400" : "text-burgundy"
                }`}
              >
                {t.name}
              </p>
              <p className="mt-3">
                <span className="font-display text-4xl">{t.startingAt}</span>
                <span
                  className={`ml-2 text-sm ${
                    t.featured ? "text-bone/70" : "text-ink/60"
                  }`}
                >
                  starting
                </span>
              </p>
              <p
                className={`mt-2 text-sm ${
                  t.featured ? "text-bone/85" : "text-ink/75"
                }`}
              >
                {t.match}
              </p>
              <ul className="mt-5 space-y-2 text-sm">
                {t.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <svg
                      aria-hidden
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={
                        t.featured ? "text-burgundy-400 mt-0.5 shrink-0" : "text-burgundy mt-0.5 shrink-0"
                      }
                    >
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/quote"
                className={`block text-center mt-6 rounded-md px-4 py-3 font-semibold ${
                  t.featured
                    ? "bg-burgundy text-bone hover:bg-burgundy-400"
                    : "bg-navy text-bone hover:bg-navy-700"
                }`}
              >
                Get a quote
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-xl bg-white border border-navy/10 p-6 md:p-8">
          <h2 className="font-display text-2xl text-navy">
            What changes the price?
          </h2>
          <ul className="mt-4 grid sm:grid-cols-2 gap-3 text-sm text-ink/85">
            <li>Time since last deep clean (more buildup = more time)</li>
            <li>Number of burners and side burners</li>
            <li>Replacement parts (always quoted separately)</li>
            <li>Distance outside the core Cincinnati / NKY / Dayton area</li>
            <li>Rotisserie, sear zones, smoker boxes</li>
            <li>Power and water access on site</li>
          </ul>
        </div>
      </section>
    </>
  );
}
