import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Us | Tri-State Grill Cleaning — Veteran-Founded, Cincinnati",
  description:
    "Tri-State Grill Cleaning is a veteran-founded grill cleaning service serving Greater Cincinnati, Northern Kentucky, and Dayton since 2018. Locally operated, professionally done.",
};

const VALUES = [
  {
    icon: "★",
    title: "Veteran Standards",
    body: "This business was built on a veteran's standards — discipline, precision, and accountability on every single job. No shortcuts. No excuses. No corners cut.",
  },
  {
    icon: "🏠",
    title: "At Your Door",
    body: "We come to you. Always. No hauling, no dropoff, no waiting. You shouldn't have to make your schedule fit our convenience.",
  },
  {
    icon: "📍",
    title: "Locally Rooted",
    body: "This is our community. Our reputation is built job by job, neighbor by neighbor. That accountability doesn't exist at a national franchise.",
  },
];

const AREAS = [
  {
    name: "Greater Cincinnati",
    chips: [
      "Hyde Park",
      "Anderson Township",
      "Mt. Lookout",
      "Blue Ash",
      "Mason",
      "Madeira",
      "Loveland",
      "Delhi",
    ],
  },
  {
    name: "Northern Kentucky",
    chips: [
      "Covington",
      "Florence",
      "Ft. Mitchell",
      "Erlanger",
      "Crestview Hills",
      "Villa Hills",
      "Newport",
    ],
  },
  {
    name: "Dayton Area",
    chips: [
      "Centerville",
      "Kettering",
      "Beavercreek",
      "Miamisburg",
      "Springboro",
      "Oakwood",
    ],
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-navy text-bone">
        <div className="mx-auto max-w-4xl px-5 py-16 md:py-20 text-center">
          <p className="uppercase tracking-widest text-bone/55 text-xs font-semibold">
            Our Story
          </p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl">
            Built on Service. Yours and Ours.
          </h1>
          <p className="mt-5 text-bone/85 max-w-2xl mx-auto">
            Veteran-founded. Locally operated. We take the dirty work
            seriously so you can focus on what matters — good food and good
            people.
          </p>
        </div>
      </section>

      {/* Story + Owner card */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20 grid md:grid-cols-2 gap-12 items-start">
          <div>
            <p className="uppercase tracking-widest text-burgundy text-xs font-semibold">
              Who We Are
            </p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl text-navy">
              Your Neighbors. Your Crew.
            </h2>
            <div className="mt-6 space-y-4 text-ink/85 leading-relaxed">
              <p>
                {SITE.name} was founded by a U.S. veteran with a simple idea:
                residential grill owners deserve the same professional-grade
                cleaning that commercial kitchens get — done right, done at
                their home, and done by people they can actually trust.
              </p>
              <p>
                {SITE.owner} manages day-to-day operations across Cincinnati,
                Northern Kentucky, and Dayton, personally overseeing every job
                to make sure the work meets the standard we put our name on.
              </p>
              <p>
                We&apos;re not a franchise. We don&apos;t have a call center.
                When you reach out, you&apos;re talking to the people who will
                actually show up at your home and do the work. That&apos;s the
                difference.
              </p>
            </div>
          </div>

          <div className="bg-bone rounded-xl p-8 border border-border">
            <div className="flex items-center gap-4 pb-6 border-b border-border">
              <div className="h-16 w-16 rounded-full bg-navy text-bone flex items-center justify-center font-display text-xl shrink-0">
                JB
              </div>
              <div>
                <strong className="block font-display text-lg text-navy">
                  {SITE.owner}
                </strong>
                <span className="text-sm text-muted">
                  Owner &amp; Operator — {SITE.name}
                </span>
              </div>
            </div>
            <ul className="mt-6 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <span className="text-burgundy mt-0.5">★</span>
                <span className="text-ink/80">Veteran-founded business</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-burgundy mt-0.5">📍</span>
                <span className="text-ink/80">
                  Based in {SITE.cityState}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-burgundy mt-0.5">📅</span>
                <span className="text-ink/80">
                  Serving the Greater Tri-State area since {SITE.foundedYear}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-burgundy mt-0.5">✉</span>
                <a
                  href={SITE.emailHref}
                  className="text-navy hover:text-burgundy font-medium"
                >
                  {SITE.email}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-navy text-bone">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="text-center max-w-2xl mx-auto">
            <p className="uppercase tracking-widest text-bone/50 text-xs font-semibold">
              Our Values
            </p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl">
              What We Stand For
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {VALUES.map((v) => (
              <article key={v.title} className="text-center px-4">
                <div className="mx-auto h-16 w-16 rounded-md bg-burgundy text-bone flex items-center justify-center text-2xl">
                  {v.icon}
                </div>
                <h3 className="mt-5 font-display text-lg">{v.title}</h3>
                <p className="mt-2 text-sm text-bone/70">{v.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Service area */}
      <section className="bg-bone">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="text-center max-w-2xl mx-auto">
            <p className="uppercase tracking-widest text-burgundy text-xs font-semibold">
              Service Area
            </p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl text-navy">
              Where We Serve
            </h2>
            <p className="mt-4 text-ink/75">
              We proudly serve homeowners across three major metro areas in
              the Tri-State region.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {AREAS.map((a) => (
              <article
                key={a.name}
                className="rounded-xl bg-white border border-border p-7 shadow-sm"
              >
                <h3 className="font-display text-lg text-navy">{a.name}</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {a.chips.map((c) => (
                    <span
                      key={c}
                      className="rounded-full bg-bone border border-border px-3 py-1 text-xs text-navy"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <p className="mt-10 text-center text-ink/70 text-sm">
            Not sure if we cover your area?{" "}
            <a
              href={SITE.phoneHref}
              className="text-navy font-medium hover:text-burgundy"
            >
              Call or text us at {SITE.phone}
            </a>{" "}
            and we&apos;ll let you know.
          </p>
        </div>
      </section>

      <section className="bg-burgundy text-bone">
        <div className="mx-auto max-w-4xl px-5 py-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl">
            Let&apos;s Get Your Grill Clean
          </h2>
          <p className="mt-4 text-bone/90">
            Fill out our short form or call us directly. We follow up as soon as
            we can.
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
