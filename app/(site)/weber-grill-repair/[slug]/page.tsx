import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE } from "@/lib/site";
import { WEBER_REPAIR_GUIDES, getRepairGuide } from "@/lib/weber-repair-guides";

/**
 * Indexable model/problem-specific Weber repair guide (the cluster spokes).
 * Statically generated from lib/weber-repair-guides.ts with per-page metadata
 * and FAQPage structured data, funneling to /quote.
 */

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return WEBER_REPAIR_GUIDES.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const g = getRepairGuide(params.slug);
  if (!g) return { title: "Guide not found" };
  const url = `${SITE.canonicalUrl}/weber-grill-repair/${g.slug}`;
  return {
    title: `${g.title} | ${SITE.name}`,
    description: g.metaDescription,
    alternates: { canonical: url },
    openGraph: { title: g.title, description: g.metaDescription, type: "article", url },
  };
}

export default function RepairGuidePage({ params }: { params: Params }) {
  const g = getRepairGuide(params.slug);
  if (!g) notFound();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: g.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const others = WEBER_REPAIR_GUIDES.filter((x) => x.slug !== g.slug);

  return (
    <div className="bg-bone">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Hero */}
      <section className="bg-navy text-bone">
        <div className="mx-auto max-w-4xl px-5 py-14 md:py-18">
          <Link href="/weber-grill-repair" className="text-xs uppercase tracking-widest text-bone/70 hover:text-burgundy-400">
            ← Weber Grill Repair
          </Link>
          <p className="mt-4 text-xs uppercase tracking-[0.2em] font-semibold text-burgundy-400">
            {g.model} · Cincinnati · NKY · Dayton
          </p>
          <h1 className="mt-3 font-display text-3xl md:text-4xl leading-tight">{g.h1}</h1>
          <p className="mt-5 max-w-2xl text-lg text-bone/85 leading-relaxed">{g.intro}</p>
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
          {g.symptoms.map((s) => (
            <div key={s.h} className="rounded-xl border border-border bg-white p-6">
              <h3 className="font-display text-xl text-navy">{s.h}</h3>
              <p className="mt-2 text-ink/80 leading-relaxed">{s.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Diagnosis / how we fix it */}
      <section className="bg-white border-y border-border">
        <div className="mx-auto max-w-3xl px-5 py-16">
          <h2 className="font-display text-3xl text-navy">How we fix it</h2>
          <p className="mt-4 text-ink/80 leading-relaxed">{g.diagnosis}</p>
          <Link href="/quote" className="inline-block mt-7 rounded-md bg-burgundy text-bone px-8 py-4 text-sm font-semibold uppercase tracking-widest hover:bg-burgundy-400 shadow">
            Send a photo, get a quote
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-5 py-16">
        <h2 className="font-display text-3xl text-navy">Questions, answered</h2>
        <dl className="mt-8 space-y-6">
          {g.faqs.map((f) => (
            <div key={f.q} className="rounded-xl border border-border bg-white p-6">
              <dt className="font-semibold text-navy">{f.q}</dt>
              <dd className="mt-2 text-ink/80 leading-relaxed">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Related guides (internal links) */}
      <section className="bg-white border-t border-border">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <h2 className="font-display text-2xl text-navy">More Weber fixes</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {others.map((o) => (
              <Link key={o.slug} href={`/weber-grill-repair/${o.slug}`} className="rounded-lg border border-border p-4 hover:border-burgundy">
                <p className="font-semibold text-navy">{o.model}</p>
                <p className="text-sm text-ink/70">{o.topic}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-navy text-bone">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <h2 className="font-display text-3xl md:text-4xl">Bring your Weber back to life</h2>
          <p className="mt-3 text-bone/80">Free quote, honest answer, repair + deep clean in one visit. Cincinnati, NKY &amp; Dayton.</p>
          <Link href="/quote" className="inline-block mt-6 rounded-md bg-burgundy text-bone px-8 py-4 text-sm font-semibold uppercase tracking-widest hover:bg-burgundy-400 shadow">
            Get my free quote →
          </Link>
        </div>
      </section>
    </div>
  );
}
