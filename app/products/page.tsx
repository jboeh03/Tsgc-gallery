import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { productsByCategory } from "@/lib/products";

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
                    className="flex flex-col rounded-xl border border-border bg-white p-6 shadow-sm transition hover:shadow-md hover:border-burgundy/40"
                  >
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
                        href={p.url}
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
