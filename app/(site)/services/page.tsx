import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Grill Cleaning Services | Tri-State Grill Cleaning — Cincinnati, NKY & Dayton",
  description:
    "Professional grill and BBQ cleaning services. Deep degreasing, cleaning, sanitation, and safety inspection for gas grills, smokers, and flat tops. Serving Greater Cincinnati. Book a free quote.",
};

const INCLUDED = [
  {
    title: "Complete Break-Down",
    body: "We disassemble your grill fully — grates, heat plates, flavorizer bars, drip pans, and cook box — so nothing gets missed.",
  },
  {
    title: "Deep Degreasing — So Flare-Ups Stop Ruining Your Cooks",
    body: "Years of grease buildup are the number one cause of flare-ups and uneven heat. We degrease every internal surface top to bottom.",
  },
  {
    title: "Cleaning & Sanitation — Restaurant-Grade Results",
    body: "We scrub, rinse, and sanitize grill racks, flavorizer bars, heat plates, and the full cook box interior. The outside gets cleaned too.",
  },
  {
    title: "Safety Inspection — We Catch Problems Early",
    body: "Every job includes a thorough inspection of rotisserie racks, igniters, thermometers, burners, pressure regulators, and gas tubes. If something's off, we tell you — with no upsell pressure.",
  },
  {
    title: "Done at Your Home",
    body: "We come to you. No hauling, no dropoff, no wait. We set up at your home and leave your grill ready to fire up immediately.",
  },
];

const GRILL_TYPES = [
  {
    icon: "🔥",
    title: "Gas Grills",
    sub: "2-burner to 6+ burner, all brands",
  },
  {
    icon: "🧊",
    title: "Charcoal Grills",
    sub: "Kettles, barrels, and kamados",
  },
  {
    icon: "💨",
    title: "Smokers",
    sub: "Offset, vertical, pellet smokers",
  },
  {
    icon: "🍳",
    title: "Flat Tops & Griddles",
    sub: "Blackstone, Camp Chef, and more",
  },
];

const WHY = [
  {
    title: "Better Tasting Food",
    body: "Old grease imparts rancid flavors on everything you cook. A clean grill means your food tastes like the recipe, not like last month's cookout.",
  },
  {
    title: "Safer Cooking",
    body: "Grease fires are the number one cause of grill-related injuries. Regular cleaning removes the fuel that causes dangerous flare-ups and unexpected fires.",
  },
  {
    title: "Longer Grill Life",
    body: "Grease and corrosion destroy grill components over time. Annual cleaning extends the life of your grates, burners, and heat plates significantly.",
  },
];

const FAQ = [
  {
    q: "How long does a cleaning take?",
    a: "Most jobs take 2–6 hours, depending on grill size, complexity, and how long it's been since the last deep clean. We'll give you a time estimate when you book.",
  },
  {
    q: "Do I need to do anything to prepare?",
    a: "Just make sure your grill is accessible and cooled down. We handle everything else — we bring all our equipment and cleaning supplies.",
  },
  {
    q: "How often should I have my grill cleaned?",
    a: "For typical residential use, once a year is recommended — ideally before grilling season. Heavy users (weekly grilling, large parties) may benefit from twice a year.",
  },
  {
    q: "What areas do you serve?",
    a: "We serve Greater Cincinnati (including Hyde Park, Anderson Township, Blue Ash, Mason), Northern Kentucky (Covington, Florence, Ft. Mitchell), and the Dayton area (Centerville, Kettering, Beavercreek). Not sure if you're in our area? Call or text us.",
  },
  {
    q: "Do you offer any recurring plans?",
    a: "Yes — we offer a seasonal membership that covers two cleanings per year (spring and fall) at a discounted rate. Ask us about it when you book.",
  },
];

export default function ServicesPage() {
  return (
    <>
      <section className="bg-navy text-bone">
        <div className="mx-auto max-w-4xl px-5 py-16 md:py-20 text-center">
          <p className="uppercase tracking-widest text-bone/55 text-xs font-semibold">
            Our Services
          </p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl">
            What We Do (And Why It Matters)
          </h1>
          <p className="mt-5 text-bone/85 max-w-2xl mx-auto">
            We don&apos;t just clean grills — we restore them. Every job is a
            full break-down, deep clean, and safety inspection at your home.
          </p>
        </div>
      </section>

      {/* Included */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20 grid gap-12 md:grid-cols-2 items-start">
          <div>
            <p className="uppercase tracking-widest text-burgundy text-xs font-semibold">
              Every Job Includes
            </p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl text-navy">
              The Full Treatment. No Add-Ons.
            </h2>
            <ul className="mt-8 divide-y divide-border">
              {INCLUDED.map((i) => (
                <li key={i.title} className="flex gap-4 py-5">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-burgundy text-bone text-sm shrink-0 mt-0.5">
                    ✓
                  </span>
                  <div>
                    <h3 className="font-display text-base text-navy">
                      {i.title}
                    </h3>
                    <p className="mt-1 text-sm text-ink/75">{i.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-navy text-bone rounded-xl p-8">
            <h3 className="font-display text-xl">We Clean All Grill Types</h3>
            <ul className="mt-5 space-y-3">
              {GRILL_TYPES.map((g) => (
                <li
                  key={g.title}
                  className="flex items-center gap-4 rounded-md bg-bone/[0.07] px-4 py-3"
                >
                  <span className="text-2xl" aria-hidden>
                    {g.icon}
                  </span>
                  <div>
                    <strong className="block font-display text-base">
                      {g.title}
                    </strong>
                    <span className="text-xs text-bone/65">{g.sub}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing — quote-based with a "from" anchor (premium, just-under-Bar-B-Clean
          position). $179 floor is modeled off competitor pricing; confirm against a
          real Bar-B-Clean quote + actual job costs before deploy. We deliberately do
          NOT post a full grid — at this price point a visible cheaper competitor
          ($149) would win the side-by-side before we can sell our value. */}
      <section className="bg-navy text-bone">
        <div className="mx-auto max-w-3xl px-5 py-16 md:py-20 text-center">
          <p className="uppercase tracking-widest text-bone/55 text-xs font-semibold">
            Pricing
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl">
            Pro-Grade Cleaning, Honest Quotes
          </h2>
          <div className="mt-7 flex items-baseline justify-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-bone/60">
              Starting at
            </span>
            <span className="font-display text-6xl leading-none">$179</span>
          </div>
          <p className="mt-6 text-bone/85 max-w-xl mx-auto">
            Every grill is different — size, condition, and how long it&apos;s
            been since the last clean all factor in. So instead of a
            one-size-fits-all price tag, we give you an exact quote up front:
            no surprises, no upsell pressure. Every job is the full
            break-down, deep degrease, sanitation, and safety inspection
            described above.
          </p>
          <p className="mt-3 text-bone/65 text-sm">
            Free quotes · Price confirmed before we start · Veteran-owned,
            serving Cincinnati, NKY &amp; Dayton since {SITE.foundedYear}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/quote"
              className="rounded-md bg-bone text-navy px-7 py-3.5 font-semibold uppercase tracking-widest text-sm hover:bg-white shadow"
            >
              Get My Free Quote &rarr;
            </Link>
            <a
              href={SITE.phoneHref}
              className="rounded-md border border-bone/40 px-7 py-3.5 font-semibold uppercase tracking-widest text-sm hover:bg-bone/10"
            >
              ☎ {SITE.phone}
            </a>
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="bg-bone">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="text-center max-w-2xl mx-auto">
            <p className="uppercase tracking-widest text-burgundy text-xs font-semibold">
              Why It Matters
            </p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl text-navy">
              A Clean Grill Isn&apos;t Just Cosmetic
            </h2>
            <p className="mt-4 text-ink/75">
              Buildup affects your food, your safety, and how long your grill
              lasts.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {WHY.map((w) => (
              <article
                key={w.title}
                className="rounded-xl bg-white border border-border p-7 shadow-sm"
              >
                <h3 className="font-display text-xl text-navy">{w.title}</h3>
                <p className="mt-2 text-sm text-ink/80">{w.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-5 py-16 md:py-20">
          <div className="text-center">
            <p className="uppercase tracking-widest text-burgundy text-xs font-semibold">
              Common Questions
            </p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl text-navy">
              Frequently Asked
            </h2>
          </div>
          <div className="mt-10 space-y-4">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-lg border border-border bg-white open:shadow-sm"
              >
                <summary className="cursor-pointer list-none flex items-start justify-between gap-4 p-5 font-display text-navy">
                  <span>{item.q}</span>
                  <svg
                    aria-hidden
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-burgundy shrink-0 mt-1 transition-transform group-open:rotate-45"
                  >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-ink/80 text-sm leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-burgundy text-bone">
        <div className="mx-auto max-w-4xl px-5 py-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl">Ready to Book?</h2>
          <p className="mt-4 text-bone/90">
            Fill out our short form or give us a call. We&apos;ll follow up
            within 24 hours with a quote and available times.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/quote"
              className="rounded-md bg-bone text-burgundy px-7 py-3.5 font-semibold uppercase tracking-widest text-sm hover:bg-white shadow"
            >
              Get a Free Quote &rarr;
            </Link>
            <a
              href={SITE.phoneHref}
              className="rounded-md border border-bone/40 px-7 py-3.5 font-semibold uppercase tracking-widest text-sm hover:bg-bone/10"
            >
              ☎ {SITE.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
