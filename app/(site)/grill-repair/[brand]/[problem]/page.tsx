import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE } from "@/lib/site";
import { GRILL_BRANDS, getBrand, getBrandGuide } from "@/lib/grill-repair-brands";

/**
 * Brand + problem specific repair guide (cluster spoke), statically generated
 * with per-page metadata + FAQPage schema. Primary CTA = free quote; secondary
 * CTA = the brand's grillpartsreplacement affiliate link for DIY searchers.
 */

type Params = { brand: string; problem: string };

export function generateStaticParams(): Params[] {
  return GRILL_BRANDS.flatMap((b) => b.guides.map((g) => ({ brand: b.slug, problem: g.slug })));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const found = getBrandGuide(params.brand, params.problem);
  if (!found) return { title: "Guide not found" };
  const { guide } = found;
  const url = `${SITE.canonicalUrl}/grill-repair/${params.brand}/${params.problem}`;
  return {
    title: `${guide.title} | ${SITE.name}`,
    description: guide.metaDescription,
    alternates: { canonical: url },
    openGraph: { title: guide.title, description: guide.metaDescription, type: "article", url },
  };
}

export default function BrandGuidePage({ params }: { params: Params }) {
  const found = getBrandGuide(params.brand, params.problem);
  if (!found) notFound();
  const { brand, guide } = found;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const others = brand.guides.filter((g) => g.slug !== guide.slug);

  return (
    <div className="bg-bone">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Hero */}
      <section className="bg-navy text-bone">
        <div className="mx-auto max-w-4xl px-5 py-14 md:py-18">
          <Link href={`/grill-repair/${brand.slug}`} className="text-xs uppercase tracking-widest text-bone/70 hover:text-burgundy-400">
            ← {brand.name} Grill Repair
          </Link>
          <p className="mt-4 text-xs uppercase tracking-[0.2em] font-semibold text-burgundy-400">
            {brand.name} · Cincinnati · NKY · Dayton
          </p>
          <h1 className="mt-3 font-display text-3xl md:text-4xl leading-tight">{guide.h1}</h1>
          <p className="mt-5 max-w-2xl text-lg text-bone/85 leading-relaxed">{guide.intro}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/quote" className="rounded-md bg-burgundy text-bone px-7 py-3.5 text-sm font-semibold uppercase tracking-widest hover:bg-burgundy-400 shadow">
              Get a free quote →
            </Link>
            <a href={SITE.phoneHref} className="rounded-md border border-bone/30 px-7 py-3.5 text-sm font-semibold uppercase tracking-widest hover:bg-bone/10">
              ☎ {SITE.phone}
            </a>
          </div>
        </div>
      </section>

      {/* Symptoms */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="font-display text-3xl text-navy">What you&apos;re seeing</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {guide.symptoms.map((s) => (
            <div key={s.h} className="rounded-xl border border-border bg-white p-6">
              <h3 className="font-display text-xl text-navy">{s.h}</h3>
              <p className="mt-2 text-ink/80 leading-relaxed">{s.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Diagnosis */}
      <section className="bg-white border-y border-border">
        <div className="mx-auto max-w-3xl px-5 py-16">
          <h2 className="font-display text-3xl text-navy">How we fix it</h2>
          <p className="mt-4 text-ink/80 leading-relaxed">{guide.diagnosis}</p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
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

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-5 py-16">
        <h2 className="font-display text-3xl text-navy">Questions, answered</h2>
        <dl className="mt-8 space-y-6">
          {guide.faqs.map((f) => (
            <div key={f.q} className="rounded-xl border border-border bg-white p-6">
              <dt className="font-semibold text-navy">{f.q}</dt>
              <dd className="mt-2 text-ink/80 leading-relaxed">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Related guides */}
      {others.length > 0 ? (
        <section className="bg-white border-t border-border">
          <div className="mx-auto max-w-5xl px-5 py-14">
            <h2 className="font-display text-2xl text-navy">More {brand.name} fixes</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {others.map((o) => (
                <Link key={o.slug} href={`/grill-repair/${brand.slug}/${o.slug}`} className="rounded-lg border border-border p-4 hover:border-burgundy">
                  <p className="font-semibold text-navy">{brand.name}</p>
                  <p className="text-sm text-ink/70">{o.topic}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Final CTA */}
      <section className="bg-navy text-bone">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <h2 className="font-display text-3xl md:text-4xl">Bring your {brand.name} back to life</h2>
          <p className="mt-3 text-bone/80">Free quote, honest answer, repair + deep clean in one visit. Cincinnati, NKY &amp; Dayton.</p>
          <Link href="/quote" className="inline-block mt-6 rounded-md bg-burgundy text-bone px-8 py-4 text-sm font-semibold uppercase tracking-widest hover:bg-burgundy-400 shadow">
            Get my free quote →
          </Link>
        </div>
      </section>
    </div>
  );
}
