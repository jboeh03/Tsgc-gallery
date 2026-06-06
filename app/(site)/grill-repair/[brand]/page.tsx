import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE } from "@/lib/site";
import { GRILL_BRANDS, getBrand } from "@/lib/grill-repair-brands";

/** Brand hub — lists that brand's repair guides and funnels to a free quote. */

type Params = { brand: string };

export function generateStaticParams(): Params[] {
  return GRILL_BRANDS.map((b) => ({ brand: b.slug }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const brand = getBrand(params.brand);
  if (!brand) return { title: "Brand not found" };
  const title = `${brand.name} Grill Repair — Cincinnati, NKY & Dayton`;
  const description = `${brand.name} grill repair and restoration across Greater Cincinnati. Igniters, burners, grates and more — repaired and deep-cleaned in one visit. Free photo quote.`;
  const url = `${SITE.canonicalUrl}/grill-repair/${brand.slug}`;
  return {
    title: `${title} | ${SITE.name}`,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, type: "website", url },
  };
}

export default function BrandHubPage({ params }: { params: Params }) {
  const brand = getBrand(params.brand);
  if (!brand) notFound();

  return (
    <div className="bg-bone">
      {/* Hero */}
      <section className="bg-navy text-bone">
        <div className="mx-auto max-w-4xl px-5 py-16 md:py-20">
          <Link href="/grill-repair" className="text-xs uppercase tracking-widest text-bone/70 hover:text-burgundy-400">
            ← All grill repair
          </Link>
          <p className="mt-4 text-xs uppercase tracking-[0.2em] font-semibold text-burgundy-400">
            {brand.name} Specialists · Cincinnati · NKY · Dayton
          </p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl leading-tight">
            {brand.name} Grill Repair &amp; Restoration
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-bone/85 leading-relaxed">{brand.intro}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/quote" className="rounded-md bg-burgundy text-bone px-7 py-3.5 text-sm font-semibold uppercase tracking-widest hover:bg-burgundy-400 shadow">
              Get a free repair quote →
            </Link>
            <a href={SITE.phoneHref} className="rounded-md border border-bone/30 px-7 py-3.5 text-sm font-semibold uppercase tracking-widest hover:bg-bone/10">
              ☎ {SITE.phone}
            </a>
          </div>
        </div>
      </section>

      {/* Common fixes */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="font-display text-3xl text-navy">Common {brand.name} fixes</h2>
        <p className="mt-3 max-w-2xl text-ink/80">
          Searching a specific problem? Start here — then send a photo for a free quote.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {brand.guides.map((g) => (
            <Link
              key={g.slug}
              href={`/grill-repair/${brand.slug}/${g.slug}`}
              className="rounded-xl border border-border bg-white p-5 hover:border-burgundy"
            >
              <p className="font-display text-lg text-navy">{g.topic}</p>
              <p className="mt-1 text-sm text-ink/70 line-clamp-2">{g.metaDescription}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Repair + clean positioning */}
      <section className="bg-white border-y border-border">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center">
          <h2 className="font-display text-3xl text-navy">
            Repair <span className="text-burgundy">and</span> deep clean — one visit
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-ink/80 leading-relaxed">
            We come to your home, fix what&apos;s broken on your {brand.name}, and strip away years of
            grease and carbon so it&apos;s safe, even-heating, and looks like new — without you lifting a
            wrench. See the difference in our{" "}
            <Link href="/gallery" className="text-burgundy underline underline-offset-4">before &amp; after gallery</Link>.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <Link href="/quote" className="rounded-md bg-burgundy text-bone px-8 py-4 text-sm font-semibold uppercase tracking-widest hover:bg-burgundy-400 shadow">
              Send a photo, get a quote
            </Link>
            <a
              href={brand.partsUrl}
              target="_blank"
              rel="nofollow sponsored noopener"
              className="text-sm font-semibold text-navy underline underline-offset-4 hover:text-burgundy"
            >
              Prefer DIY? Shop genuine {brand.name} parts ↗
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-navy text-bone">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <h2 className="font-display text-3xl md:text-4xl">Bring your {brand.name} back to life</h2>
          <p className="mt-3 text-bone/80">Free quote, honest answer. Cincinnati, NKY &amp; Dayton.</p>
          <Link href="/quote" className="inline-block mt-6 rounded-md bg-burgundy text-bone px-8 py-4 text-sm font-semibold uppercase tracking-widest hover:bg-burgundy-400 shadow">
            Get my free quote →
          </Link>
        </div>
      </section>
    </div>
  );
}
