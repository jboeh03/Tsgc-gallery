import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { GRILL_BRANDS, GROUP_LABELS, brandFinderIndex, type BrandGroup } from "@/lib/grill-repair-brands";
import GrillBrandFinder from "@/components/GrillBrandFinder";

/**
 * Parent grill-repair hub. Targets head terms ("grill repair Cincinnati") and
 * routes searchers to the right brand via tiles + a type-to-find selector.
 */

const TITLE = "Grill Repair — Cincinnati, NKY & Dayton";
const DESCRIPTION =
  "We repair and restore premium gas, built-in, and pellet grills across Greater Cincinnati — Weber, Napoleon, Traeger, Blaze and more — then deep-clean in the same visit. Free photo quote.";

export const metadata: Metadata = {
  title: `${TITLE} | ${SITE.name}`,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.canonicalUrl}/grill-repair` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: `${SITE.canonicalUrl}/grill-repair` },
};

// Weber is featured first (its own sprint-aligned page); then the data-driven brands.
const WEBER_TILE = { name: "Weber", href: "/weber-grill-repair", blurb: "Spirit, Genesis & Summit — igniters, flavorizer bars, burners, grates." };

export default function GrillRepairHub() {
  const groups: BrandGroup[] = ["gas", "built-in", "pellet"];
  const finderBrands = brandFinderIndex();

  return (
    <div className="bg-bone">
      {/* Hero */}
      <section className="bg-navy text-bone">
        <div className="mx-auto max-w-4xl px-5 py-16 md:py-20">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-burgundy-400">
            Grill Repair Specialists · Cincinnati · NKY · Dayton
          </p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl leading-tight">
            Grill Repair &amp; Restoration
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-bone/85 leading-relaxed">
            Igniter won&apos;t spark? Burners rusted? Pellet grill won&apos;t feed? We repair premium
            grills across Greater Cincinnati — and deep-clean them in the same visit. Before you buy
            new, find your brand below or send us a photo.
          </p>
          <div className="mt-7">
            <GrillBrandFinder brands={finderBrands} />
          </div>
        </div>
      </section>

      {/* Featured: Weber */}
      <section className="mx-auto max-w-5xl px-5 pt-14">
        <Link
          href={WEBER_TILE.href}
          className="block rounded-2xl border border-burgundy/40 bg-white p-6 hover:border-burgundy shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-2xl text-navy">Weber Grill Repair</p>
              <p className="mt-1 text-ink/75">{WEBER_TILE.blurb}</p>
            </div>
            <span className="text-sm font-semibold uppercase tracking-widest text-burgundy">View guides →</span>
          </div>
        </Link>
      </section>

      {/* Brands by group */}
      <section className="mx-auto max-w-5xl px-5 py-14">
        {groups.map((group) => {
          const brands = GRILL_BRANDS.filter((b) => b.group === group);
          if (brands.length === 0) return null;
          return (
            <div key={group} className="mb-12 last:mb-0">
              <h2 className="font-display text-2xl text-navy">{GROUP_LABELS[group]}</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {brands.map((b) => (
                  <Link
                    key={b.slug}
                    href={`/grill-repair/${b.slug}`}
                    className="rounded-xl border border-border bg-white p-5 hover:border-burgundy"
                  >
                    <p className="font-display text-xl text-navy">{b.name}</p>
                    {b.blurb ? <p className="mt-1 text-sm text-ink/70">{b.blurb}</p> : null}
                    <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-burgundy">
                      {b.name} repair →
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* CTA */}
      <section className="bg-white border-t border-border">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <h2 className="font-display text-3xl text-navy">Don&apos;t see your brand?</h2>
          <p className="mt-3 text-ink/80">
            We service most premium gas, built-in, pellet and charcoal grills. Send a photo and
            we&apos;ll tell you honestly whether it&apos;s worth repairing.
          </p>
          <Link
            href="/quote"
            className="inline-block mt-6 rounded-md bg-burgundy text-bone px-8 py-4 text-sm font-semibold uppercase tracking-widest hover:bg-burgundy-400 shadow"
          >
            Get a free quote →
          </Link>
        </div>
      </section>
    </div>
  );
}
