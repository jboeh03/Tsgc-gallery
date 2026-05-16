import Link from "next/link";
import { SITE } from "@/lib/site";

const SERVICES = [
  {
    slug: "gas",
    title: "Gas grills",
    blurb:
      "Weber, Napoleon, Spirit, Genesis — full teardown, degrease, polish.",
  },
  {
    slug: "charcoal",
    title: "Charcoal & kamado",
    blurb:
      "Big Green Egg, Kamado Joe, Weber kettles — ash-out, ceramic refresh, gasket check.",
  },
  {
    slug: "pellet",
    title: "Pellet smokers",
    blurb:
      "Traeger, Pit Boss, Yoder — firepot clear, drip-tray service, fresh foil.",
  },
  {
    slug: "built-in",
    title: "Built-in islands",
    blurb:
      "Lynx, DCS, Hestan, Alfresco — pulled, serviced in place, sealed back up.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Book a free quote",
    body: "Send a few photos and your grill model. We'll come back with a flat price within 24 hours.",
  },
  {
    n: "2",
    title: "We come to you",
    body: "Driveway, patio, dockside — we bring the gear. Most cleanings take 2–4 hours start to finish.",
  },
  {
    n: "3",
    title: "Fire it up that night",
    body: "We leave the grill ready to cook. Photos and a service report land in your inbox.",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-navy text-bone overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(900px 500px at 20% 0%, rgba(155,39,61,0.45), transparent 60%), radial-gradient(700px 400px at 90% 100%, rgba(39,64,115,0.7), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-5 py-20 md:py-28 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="uppercase tracking-widest text-burgundy-400 text-xs font-semibold">
              Veteran-founded · Cincinnati · NKY · Dayton
            </p>
            <h1 className="mt-4 font-display text-4xl md:text-6xl leading-tight">
              Your grill, restored to <span className="text-burgundy-400">day-one condition.</span>
            </h1>
            <p className="mt-6 text-lg text-bone/85 max-w-xl">
              Deep cleanings, top to bottom, on your property. We pull it apart,
              degrease every surface, and put it back together better than the
              installer left it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/quote"
                className="rounded-md bg-burgundy text-bone px-6 py-3 font-semibold hover:bg-burgundy-400 shadow"
              >
                Get a Free Quote
              </Link>
              <Link
                href="/gallery"
                className="rounded-md border border-bone/40 text-bone px-6 py-3 font-semibold hover:bg-bone/10"
              >
                See Before / After
              </Link>
            </div>
            <p className="mt-6 text-sm text-bone/60">
              Fast quotes &middot; flat-rate pricing &middot; fully insured
            </p>
          </div>

          {/* Stat card */}
          <div className="bg-bone text-ink rounded-xl shadow-xl p-6 md:p-8 grid grid-cols-3 gap-4 text-center">
            <Stat number="200+" label="Grills serviced" />
            <Stat number="3" label="States covered" />
            <Stat number="4.9★" label="Average rating" />
            <div className="col-span-3 border-t pt-4 mt-1">
              <p className="text-sm text-ink/70">
                &ldquo;Looks better than when I bought it. Will book again next
                spring.&rdquo;
              </p>
              <p className="mt-2 text-xs uppercase tracking-widest text-navy">
                — Recent customer, Indian Hill
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services teaser */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <p className="uppercase tracking-widest text-burgundy text-xs font-semibold">
            What we clean
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl text-navy">
            Every grill, every brand.
          </h2>
          <p className="mt-4 text-ink/75">
            If it has a grate, we&apos;ll bring it back. Most jobs run 2 to 4
            hours, with the heaviest builds finishing same-day.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <Link
              key={s.slug}
              href={`/services#${s.slug}`}
              className="block rounded-xl border border-navy/10 bg-white p-6 hover:border-burgundy/50 hover:shadow-md transition"
            >
              <p className="font-display text-xl text-navy">{s.title}</p>
              <p className="mt-2 text-sm text-ink/75">{s.blurb}</p>
              <p className="mt-4 text-xs uppercase tracking-widest text-burgundy">
                See details &rarr;
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-navy/10">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="text-center max-w-2xl mx-auto">
            <p className="uppercase tracking-widest text-burgundy text-xs font-semibold">
              How it works
            </p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl text-navy">
              Three steps. No surprises.
            </h2>
          </div>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <li
                key={s.n}
                className="rounded-xl bg-bone p-6 border border-navy/10"
              >
                <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-burgundy text-bone font-display text-lg">
                  {s.n}
                </span>
                <p className="mt-4 font-display text-xl text-navy">
                  {s.title}
                </p>
                <p className="mt-2 text-sm text-ink/75">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Why us */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="uppercase tracking-widest text-burgundy text-xs font-semibold">
            Why Tri-State
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl text-navy">
            Trained eyes. Honest work.
          </h2>
          <p className="mt-4 text-ink/80">
            Tri-State Grill Cleaning was founded by a US military veteran who
            got tired of seeing $2,000 grills written off as &ldquo;done&rdquo;
            because nobody local would take them apart. We do.
          </p>
          <ul className="mt-6 space-y-3 text-ink/80">
            <Bullet>Flat pricing — quoted up front, no day-of upcharges.</Bullet>
            <Bullet>Fully insured. Your patio, deck, and stone are protected.</Bullet>
            <Bullet>Food-safe degreasers. Safe on stainless, ceramic, and cast.</Bullet>
            <Bullet>Service report + photos after every job.</Bullet>
          </ul>
          <div className="mt-8">
            <Link
              href="/about"
              className="text-burgundy font-semibold hover:underline"
            >
              Read our story &rarr;
            </Link>
          </div>
        </div>
        <div className="bg-navy text-bone rounded-xl p-8 shadow-lg">
          <p className="font-display text-2xl">Serving the Tri-State.</p>
          <ul className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {SITE.serviceArea.map((a) => (
              <li
                key={a}
                className="rounded-md border border-bone/20 px-3 py-2"
              >
                {a}
              </li>
            ))}
            <li className="rounded-md border border-bone/20 px-3 py-2">
              Indian Hill
            </li>
            <li className="rounded-md border border-bone/20 px-3 py-2">
              Hyde Park
            </li>
            <li className="rounded-md border border-bone/20 px-3 py-2">
              Mason
            </li>
            <li className="rounded-md border border-bone/20 px-3 py-2">
              Ft. Mitchell
            </li>
          </ul>
          <p className="mt-5 text-sm text-bone/70">
            Don&apos;t see your town? Most addresses within 45 minutes of
            Cincinnati qualify. Ask when you book.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-burgundy text-bone">
        <div className="mx-auto max-w-4xl px-5 py-14 md:py-16 text-center">
          <h2 className="font-display text-3xl md:text-4xl">
            Ready to see your grill on the gallery page?
          </h2>
          <p className="mt-4 text-bone/90">
            Free quotes in 24 hours. No pressure, no sales calls.
          </p>
          <Link
            href="/quote"
            className="inline-block mt-8 rounded-md bg-bone text-burgundy px-8 py-4 text-lg font-semibold hover:bg-white shadow"
          >
            Get a Free Quote
          </Link>
        </div>
      </section>
    </>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <p className="font-display text-3xl text-navy">{number}</p>
      <p className="mt-1 text-xs uppercase tracking-widest text-ink/70">
        {label}
      </p>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden
        className="mt-1 inline-block h-2 w-2 rounded-full bg-burgundy shrink-0"
      />
      <span>{children}</span>
    </li>
  );
}
