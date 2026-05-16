import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Services · Tri-State Grill Cleaning",
  description:
    "Deep cleaning for gas, charcoal, pellet, and built-in grills across Cincinnati, NKY, and Dayton.",
};

type Service = {
  slug: string;
  title: string;
  subhead: string;
  includes: string[];
  typicalHours: string;
};

const SERVICES: Service[] = [
  {
    slug: "gas",
    title: "Gas grills",
    subhead:
      "Weber, Napoleon, Broil King, Spirit, Genesis, Saber, and the rest.",
    typicalHours: "2.5 – 3.5 hours",
    includes: [
      "Full teardown: grates, flavorizer bars, heat shields, burners, drip pan",
      "Degrease and polish stainless interior and exterior",
      "Inspect burner ports, ignitor leads, regulator hose",
      "Reassemble, test ignition, season grates",
      "Photo report on completion",
    ],
  },
  {
    slug: "charcoal",
    title: "Charcoal & kamado",
    subhead: "Big Green Egg, Kamado Joe, Primo, Weber kettle, Performer.",
    typicalHours: "2.5 – 3.0 hours",
    includes: [
      "Full ash-out and firebox vacuum",
      "Ceramic interior refresh (no harsh chemicals)",
      "Inspect and re-seat gasket, replace if shot (parts billed separately)",
      "Polish bands, hinges, exterior",
      "Inspect daisy wheel / vents, lubricate hinges",
    ],
  },
  {
    slug: "pellet",
    title: "Pellet smokers",
    subhead: "Traeger, Pit Boss, Yoder, Camp Chef, Recteq.",
    typicalHours: "2.5 – 3.5 hours",
    includes: [
      "Empty hopper, vacuum auger and firepot",
      "Pull and clean drip tray, heat shield, grates",
      "Fresh aluminum foil on drip pan",
      "Inspect induction fan, RTD probe, and igniter",
      "Reassemble, verify startup cycle",
    ],
  },
  {
    slug: "built-in",
    title: "Built-in islands",
    subhead: "Lynx, DCS, Hestan, Alfresco, Coyote, Twin Eagles.",
    typicalHours: "4.0 – 5.0 hours",
    includes: [
      "Service in place — no remove-and-haul, no shop time",
      "Pull burners, ceramic radiants, rotisserie kit",
      "Degrease hood, polish stainless to factory finish",
      "Inspect and clean rear infrared / sear burners",
      "Reassemble, leak-check gas connections, test all zones",
    ],
  },
];

const ADD_ONS = [
  "Cover purchase & install",
  "New flavorizer bars / heat shields (OEM)",
  "Replacement grates (cast iron, stainless, GrillGrate)",
  "Rotisserie kit install",
  "Regulator hose replacement",
];

export default function ServicesPage() {
  return (
    <>
      <section className="bg-navy text-bone">
        <div className="mx-auto max-w-5xl px-5 py-16 md:py-20">
          <p className="uppercase tracking-widest text-burgundy-400 text-xs font-semibold">
            Services
          </p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl">
            Deep cleanings for every grill we&apos;ve met.
          </h1>
          <p className="mt-5 text-lg text-bone/85 max-w-2xl">
            One flat price. We bring the gear, the tarps, the wash, and the
            torque wrenches. You get a grill that looks and cooks like the day
            it was delivered.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-12 md:py-16 space-y-12">
        {SERVICES.map((s) => (
          <article
            key={s.slug}
            id={s.slug}
            className="scroll-mt-24 grid md:grid-cols-3 gap-8 border-t border-navy/10 pt-10"
          >
            <header className="md:col-span-1">
              <h2 className="font-display text-3xl text-navy">{s.title}</h2>
              <p className="mt-2 text-ink/75">{s.subhead}</p>
              <p className="mt-4 inline-block rounded-full bg-burgundy/10 text-burgundy text-xs uppercase tracking-widest px-3 py-1 font-semibold">
                Typical job · {s.typicalHours}
              </p>
            </header>
            <div className="md:col-span-2">
              <p className="uppercase tracking-widest text-xs text-burgundy font-semibold">
                What&apos;s included
              </p>
              <ul className="mt-3 space-y-2">
                {s.includes.map((i) => (
                  <li key={i} className="flex gap-3">
                    <svg
                      aria-hidden
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-burgundy mt-0.5 shrink-0"
                    >
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                    <span className="text-ink/85">{i}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </section>

      <section className="bg-white border-t border-navy/10">
        <div className="mx-auto max-w-5xl px-5 py-12 md:py-16">
          <h2 className="font-display text-2xl md:text-3xl text-navy">
            Add-ons
          </h2>
          <p className="mt-2 text-ink/75 max-w-2xl">
            Anything from a new cover to a full parts swap — we&apos;ll source
            OEM where it matters and roll it into the same visit.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {ADD_ONS.map((a) => (
              <li
                key={a}
                className="rounded-md border border-navy/10 bg-bone px-4 py-3 text-sm"
              >
                {a}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-burgundy text-bone">
        <div className="mx-auto max-w-4xl px-5 py-14 text-center">
          <h2 className="font-display text-2xl md:text-3xl">
            Not sure which service fits?
          </h2>
          <p className="mt-3 text-bone/90">
            Send us a couple photos. We&apos;ll tell you exactly what your
            grill needs.
          </p>
          <Link
            href="/quote"
            className="inline-block mt-6 rounded-md bg-bone text-burgundy px-7 py-3 font-semibold hover:bg-white shadow"
          >
            Get a Free Quote
          </Link>
        </div>
      </section>
    </>
  );
}
