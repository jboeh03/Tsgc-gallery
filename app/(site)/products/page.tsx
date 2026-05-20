import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { productsByCategory, type Product, type ProductCategory } from "@/lib/products";

export const metadata: Metadata = {
  title: "Recommended Gear & Accessories | Tri-State Grill Cleaning",
  description:
    "The grill covers, tools, and accessories we actually use and recommend after thousands of hours servicing grills across Cincinnati, Northern Kentucky, and Dayton.",
  alternates: { canonical: `${SITE.canonicalUrl}/products` },
};

export default function ProductsPage() {
  const groups = productsByCategory();

  return (
    <>
      <section className="bg-navy text-bone">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20 text-center">
          <p className="uppercase tracking-widest text-bone/55 text-xs font-semibold">
            Recommended Gear
          </p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl">
            What We Actually Use & Recommend
          </h1>
          <p className="mt-5 text-bone/85 max-w-2xl mx-auto">
            After thousands of hours servicing grills, these are the covers,
            tools, and accessories that hold up. No fluff — just gear we&apos;d
            put on our own grills.
          </p>
        </div>
      </section>

      <section className="bg-bone">
        <div className="mx-auto max-w-6xl px-5 pt-8 pb-2">
          <p className="text-xs text-ink/60 italic">
            Heads up: some links below are affiliate links. As an Amazon
            Associate and Grill Parts Replacement affiliate, we earn a small
            commission on qualifying purchases at no extra cost to you. We only
            list gear we&apos;d recommend regardless.
          </p>
        </div>

        <div className="mx-auto max-w-6xl px-5 py-12 space-y-16">
          {groups.length === 0 && (
            <p className="text-center text-ink/60 py-12">
              More gear coming soon. In the meantime, give us a call — we&apos;ll
              tell you exactly what we&apos;d buy for your grill.
            </p>
          )}

          {groups.map((group) => (
            <section key={group.id}>
              <div className="mb-8">
                <p className="uppercase tracking-widest text-burgundy text-xs font-semibold">
                  {group.label}
                </p>
                <h2 className="mt-2 font-display text-2xl md:text-3xl text-navy">
                  {group.blurb}
                </h2>
              </div>

              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-col rounded-xl border border-border bg-white shadow-sm transition hover:shadow-md hover:border-burgundy/40 overflow-hidden"
                  >
                    <ProductMedia product={p} />

                    <div className="flex flex-col p-6">
                      <div className="flex items-center gap-2 mb-3">
                        {p.brand && (
                          <span className="inline-flex items-center rounded-full bg-navy/5 text-navy px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider">
                            {p.brand}
                          </span>
                        )}
                        {p.featured && (
                          <span className="inline-flex items-center rounded-full bg-burgundy text-bone px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider">
                            Our pick
                          </span>
                        )}
                      </div>

                      <h3 className="font-display text-lg text-navy">{p.name}</h3>
                      <p className="mt-2 text-sm text-ink/75 leading-relaxed">
                        {p.description}
                      </p>

                      {p.techNote && (
                        <p className="mt-3 text-xs text-ink/60 border-l-2 border-burgundy/40 pl-3 italic">
                          {p.techNote}
                        </p>
                      )}

                      <div className="mt-5 pt-5 border-t border-border flex items-center justify-between gap-3">
                        <span className="text-xs uppercase tracking-wider text-muted">
                          {p.affiliate}
                        </span>
                        <a
                          href={`/api/track/click?id=${encodeURIComponent(p.id)}`}
                          target="_blank"
                          rel="sponsored noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-md bg-burgundy hover:bg-burgundy-700 text-bone px-4 py-2 text-sm font-semibold transition"
                        >
                          Shop
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                          >
                            <path d="M7 17 17 7M9 7h8v8" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-5 py-14 text-center">
          <p className="uppercase tracking-widest text-burgundy text-xs font-semibold">
            Don&apos;t see what you need?
          </p>
          <h2 className="mt-3 font-display text-2xl md:text-3xl text-navy">
            Ask us — we&apos;ll point you to the right part.
          </h2>
          <p className="mt-4 text-ink/75">
            Burner not lighting? Heat plates rusted through? Send us a photo of
            your rating plate and we&apos;ll send back the exact part numbers.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={SITE.smsHref}
              className="inline-flex items-center justify-center rounded-md bg-burgundy hover:bg-burgundy-700 text-bone px-6 py-3 font-semibold"
            >
              Text us a photo
            </a>
            <Link
              href="/quote"
              className="inline-flex items-center justify-center rounded-md border border-navy text-navy hover:bg-navy hover:text-bone px-6 py-3 font-semibold transition"
            >
              Or book a service visit
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function ProductMedia({ product }: { product: Product }) {
  if (product.image) {
    return (
      <div className="relative aspect-square bg-bone overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
          className="object-contain p-4"
        />
      </div>
    );
  }
  return <CategoryPlaceholder category={product.category} brand={product.brand} />;
}

function CategoryPlaceholder({
  category,
  brand,
}: {
  category: ProductCategory;
  brand?: string;
}) {
  const Icon = CATEGORY_ICONS[category];
  return (
    <div className="relative aspect-square bg-gradient-to-br from-navy-900 via-navy to-navy-700 flex items-center justify-center overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #F7F3EE 0 1px, transparent 1px 14px)",
        }}
      />
      <Icon className="relative h-24 w-24 text-bone/85" />
      {brand && (
        <span className="absolute bottom-3 left-3 inline-flex items-center rounded-full bg-bone/10 backdrop-blur-sm text-bone/90 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider">
          {brand}
        </span>
      )}
    </div>
  );
}

type IconProps = { className?: string };

const CATEGORY_ICONS: Record<ProductCategory, (p: IconProps) => JSX.Element> = {
  covers: ({ className }) => (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M8 38c0-13 11-22 24-22s24 9 24 22" />
      <path d="M6 38h52l-3 14H9z" />
      <path d="M32 16v-6" />
      <path d="M28 10h8" />
    </svg>
  ),
  tools: ({ className }) => (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M14 50 36 28" />
      <path d="M28 20a8 8 0 1 1 16 0v6h-6v6h-6v-6h-4z" />
      <path d="M50 14 38 26" />
      <circle cx="14" cy="50" r="4" />
    </svg>
  ),
  grates: ({ className }) => (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="8" y="14" width="48" height="36" rx="2" />
      <path d="M8 24h48M8 32h48M8 40h48" />
      <path d="M16 14v36M32 14v36M48 14v36" />
    </svg>
  ),
  cleaning: ({ className }) => (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M26 22h12v6h4l4 6v22a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4V32l4-6z" />
      <path d="M28 14h8v8h-8z" />
      <path d="M48 16h6M48 22h6M48 28h6" />
    </svg>
  ),
  parts: ({ className }) => (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="32" cy="32" r="8" />
      <path d="M32 8v6M32 50v6M8 32h6M50 32h6M15 15l4 4M45 45l4 4M49 15l-4 4M19 45l-4 4" />
    </svg>
  ),
  accessories: ({ className }) => (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M32 8a4 4 0 0 1 4 4v26a8 8 0 1 1-8 0V12a4 4 0 0 1 4-4z" />
      <circle cx="32" cy="46" r="4" fill="currentColor" />
      <path d="M40 16h4M40 22h4M40 28h4" />
    </svg>
  ),
};
