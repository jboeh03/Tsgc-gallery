import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { isPreviewVisible } from "@/lib/preview-flag";

const SERVICE_TILES = [
  {
    icon: "🔥",
    title: "Deep Degreasing",
    body: "Years of grease buildup cause flare-ups and uneven heat. We break down and degrease every internal surface — completely.",
    bullets: [
      "Cook box interior",
      "Heat plates & flavorizer bars",
      "Lid interior & drip pans",
      "Control knobs",
    ],
  },
  {
    icon: "✨",
    title: "Cleaning & Sanitation",
    body: "Restaurant-grade results in your backyard. We scrub, rinse, and sanitize every surface until your grill passes a health inspection.",
    bullets: [
      "Grill grates & racks",
      "Full cook box",
      "Exterior surfaces",
      "Burner covers",
    ],
  },
  {
    icon: "🔍",
    title: "Safety Inspection",
    body: "Every job includes a full inspection. We catch issues before they become problems — with zero upsell pressure.",
    bullets: [
      "Burners & igniters",
      "Gas tubes & regulators",
      "Thermometers",
      "Rotisserie racks",
    ],
  },
];

const STEPS = [
  {
    n: "1",
    title: "Get a Free Quote",
    body: "Fill out our short form or give us a call. We'll follow up within 24 hours with a quote.",
  },
  {
    n: "2",
    title: "Schedule Your Clean",
    body: "Pick a time that works for you. We come to your home — no hauling required.",
  },
  {
    n: "3",
    title: "We Do the Work",
    body: "Full break-down, degrease, clean, inspect. Takes 2–6 hours depending on grill size and condition.",
  },
  {
    n: "4",
    title: "Fire It Up",
    body: "Your grill is ready to cook. Cleaner, safer, better-tasting food from day one.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Tri-State Grill Cleaning did an excellent job! Courteous, professional, communicative, and very thorough. The pricing was very fair. I'm almost afraid to use my grill now because it's so clean!",
    author: "Paddack B.",
    location: "Cincinnati, OH",
  },
  {
    quote:
      "Quick and easy estimate and squeezed us in a few days after. We invested in our grill so having it cleaned properly is a small price to pay for the longevity we will get. Highly recommend.",
    author: "Alex C.",
    location: "Cincinnati, OH",
  },
  {
    quote:
      "Tristate did an awesome job bringing it back to looking like it would pass a Health Department inspection with flying colors! Exactly what I needed for my old Weber.",
    author: "John F.",
    location: "Cincinnati, OH",
  },
];

export default function Home() {
  const showPreview = isPreviewVisible();
  return (
    <>
      {/* Hero */}
      <section className="relative bg-navy text-bone overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(900px 500px at 20% 0%, rgba(139,31,47,0.45), transparent 60%), radial-gradient(700px 400px at 90% 100%, rgba(44,74,110,0.7), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-5 py-20 md:py-28 text-center">
          <p className="uppercase tracking-[0.25em] text-bone/55 text-xs">
            Veteran-Founded &nbsp;·&nbsp; Locally Operated
          </p>
          <h1 className="mt-5 font-display text-5xl md:text-7xl leading-tight">
            We Come to You.
            <br />
            <span className="text-burgundy-400">
              Your Grill, Cleaned Right.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-bone/85">
            Professional residential grill cleaning serving Greater Cincinnati,
            Northern Kentucky, and Dayton. We break it down, degrease
            everything, and leave it cooking like new — at your home.
          </p>
          <div className="mt-9 flex flex-wrap gap-3 justify-center items-center">
            <Link
              href="/quote"
              className="rounded-md bg-burgundy text-bone px-7 py-3.5 font-semibold uppercase tracking-widest text-sm hover:bg-burgundy-400 shadow"
            >
              Get a Free Quote &rarr;
            </Link>
            <a
              href={SITE.phoneHref}
              className="text-bone/90 hover:text-burgundy-400 font-semibold"
            >
              Or call: {SITE.phone}
            </a>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <div className="bg-navy-700 text-bone/90 text-xs md:text-sm">
        <div className="mx-auto max-w-6xl px-5 py-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 uppercase tracking-widest">
          <span>★ 5-Star Rated</span>
          <span className="text-bone/30">|</span>
          <span>Veteran-Founded</span>
          <span className="text-bone/30">|</span>
          <span>Est. {SITE.foundedYear}</span>
          <span className="text-bone/30">|</span>
          <span>Cincinnati · NKY · Dayton</span>
          <span className="text-bone/30 hidden md:inline">|</span>
          <span className="hidden md:inline">At-Home Service</span>
        </div>
      </div>

      {/* Headline Before / After */}
      <section className="bg-bone">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="text-center max-w-2xl mx-auto">
            <p className="uppercase tracking-widest text-burgundy text-xs font-semibold">
              See the Difference
            </p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl text-navy">
              Same grill. Four hours apart.
            </h2>
            <p className="mt-4 text-ink/75">
              This is the standard. Every job, every customer.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <figure className="relative overflow-hidden rounded-xl border border-border bg-white shadow-sm">
              <span className="absolute top-4 left-4 z-10 inline-block rounded-md bg-burgundy text-bone text-xs font-semibold uppercase tracking-widest px-3 py-1.5 shadow">
                Before
              </span>
              <Image
                src="/gallery/tsg-011-before.jpeg"
                alt="Before: DCS built-in grill with blackened soot on the hood interior, heavy carbon buildup on the grates, and grease across the cookbox"
                width={1600}
                height={1200}
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="block w-full h-auto"
              />
            </figure>
            <figure className="relative overflow-hidden rounded-xl border border-border bg-white shadow-sm">
              <span className="absolute top-4 left-4 z-10 inline-block rounded-md bg-navy text-bone text-xs font-semibold uppercase tracking-widest px-3 py-1.5 shadow">
                After
              </span>
              <Image
                src="/gallery/tsg-011-after.jpeg"
                alt="After: same DCS built-in grill with clean stainless hood, polished cookbox, and fully restored grates"
                width={1600}
                height={1200}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="block w-full h-auto"
              />
            </figure>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/gallery"
              className="inline-block rounded-md border-2 border-navy text-navy px-6 py-3 font-semibold uppercase tracking-widest text-sm hover:bg-navy hover:text-bone"
            >
              See More Before &amp; After &rarr;
            </Link>
            {showPreview ? (
              <Link
                href="/preview"
                className="inline-block rounded-md bg-burgundy text-bone px-6 py-3 font-semibold uppercase tracking-widest text-sm hover:bg-burgundy-400 shadow"
              >
                📸 See Your Grill Clean &rarr;
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {/* Services overview */}
      <section className="bg-bone">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="text-center max-w-2xl mx-auto">
            <p className="uppercase tracking-widest text-burgundy text-xs font-semibold">
              What We Do
            </p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl text-navy">
              Professional Cleaning for Every Grill
            </h2>
            <p className="mt-4 text-ink/75">
              From 2-burner gas grills to full smokers and flat tops — we
              handle the dirty work so you can get back to cooking.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {SERVICE_TILES.map((s) => (
              <article
                key={s.title}
                className="rounded-xl border border-border bg-white p-7 shadow-sm hover:shadow-md transition"
              >
                <div className="text-3xl">{s.icon}</div>
                <h3 className="mt-4 font-display text-xl text-navy">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-ink/80">{s.body}</p>
                <ul className="mt-4 space-y-1.5 text-sm text-ink/75">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span aria-hidden className="text-burgundy">·</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/services"
              className="inline-block rounded-md border-2 border-navy text-navy px-6 py-3 font-semibold uppercase tracking-widest text-sm hover:bg-navy hover:text-bone"
            >
              See All Services
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-navy text-bone">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="text-center max-w-2xl mx-auto">
            <p className="uppercase tracking-widest text-bone/50 text-xs font-semibold">
              The Process
            </p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl">
              Simple. Professional. Done Right.
            </h2>
            <p className="mt-4 text-bone/80">
              No hauling. No dropoff. We come to you.
            </p>
          </div>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <li key={s.n} className="text-center">
                <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-burgundy text-bone font-display text-xl">
                  {s.n}
                </span>
                <h3 className="mt-4 font-display text-lg">{s.title}</h3>
                <p className="mt-2 text-sm text-bone/75">{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 text-center">
            <Link
              href="/quote"
              className="inline-block rounded-md bg-burgundy text-bone px-7 py-3.5 font-semibold uppercase tracking-widest text-sm hover:bg-burgundy-400 shadow"
            >
              Get a Free Quote &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="uppercase tracking-widest text-burgundy text-xs font-semibold">
              Why Tri-State
            </p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl text-navy">
              Built on Service. Yours and Ours.
            </h2>
            <div className="mt-8 space-y-6">
              <ValueRow
                icon="★"
                title="Veteran-Founded"
                body="Built on a veteran's standards from day one — discipline, precision, and accountability on every job. No shortcuts. No cut corners."
              />
              <ValueRow
                icon="🏠"
                title="At Your Home"
                body="We come to you. No hauling, no dropoff, no waiting. We set up, clean on-site, and leave your grill ready to use immediately."
              />
              <ValueRow
                icon="📍"
                title="Your Neighbors"
                body="We live and work in this community. Every job carries our name. We stand behind our work with our reputation on the line — not a franchise's."
              />
            </div>
          </div>
          <div className="bg-bone rounded-xl p-10 border border-border text-center min-h-[360px] flex flex-col justify-center items-center">
            <Image
              src="/logos/logo-2-color.png"
              alt={SITE.name}
              width={200}
              height={200}
              className="h-40 w-40 mb-2"
            />
            <p className="font-display text-2xl text-navy">{SITE.name}</p>
            <p className="mt-4 text-ink/70 max-w-xs text-sm leading-relaxed">
              Serving Cincinnati, Northern Kentucky, and Dayton since{" "}
              {SITE.foundedYear}.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {SITE.serviceArea.map((a) => (
                <span
                  key={a}
                  className="rounded-full bg-white border border-border px-4 py-1.5 text-xs uppercase tracking-widest text-navy"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-bone">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="text-center max-w-2xl mx-auto">
            <p className="uppercase tracking-widest text-burgundy text-xs font-semibold">
              Reviews
            </p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl text-navy">
              What Our Customers Say
            </h2>
            <p className="mt-4 text-ink/75">
              Five-star rated by homeowners across Greater Cincinnati.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure
                key={t.author}
                className="rounded-xl bg-white border border-border p-7 shadow-sm"
              >
                <div className="text-burgundy">★★★★★</div>
                <blockquote className="mt-3 text-ink/85 text-sm leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-4 text-xs uppercase tracking-widest text-muted">
                  — {t.author} &middot; {t.location}
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-10 text-center">
            <a
              href={SITE.social.googleReview}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-md border-2 border-navy text-navy px-6 py-3 font-semibold uppercase tracking-widest text-sm hover:bg-navy hover:text-bone"
            >
              ★ Leave Us a Google Review &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-burgundy text-bone">
        <div className="mx-auto max-w-4xl px-5 py-14 md:py-16 text-center">
          <h2 className="font-display text-3xl md:text-4xl">
            Ready for a Clean Grill?
          </h2>
          <p className="mt-4 text-bone/90">
            Fill out our short form and we&apos;ll follow up within 24 hours.
            No commitment, no pressure.
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

function ValueRow({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="text-2xl text-burgundy shrink-0">{icon}</div>
      <div>
        <h3 className="font-display text-lg text-navy">{title}</h3>
        <p className="mt-1 text-sm text-ink/80">{body}</p>
      </div>
    </div>
  );
}
