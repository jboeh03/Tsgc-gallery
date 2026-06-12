import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import {
  partsByBrand,
  PART_CATEGORY_LABELS,
  SHIPPING_FEE,
  type Part,
  type PartCategory,
} from "@/lib/parts/catalog";
import { CartProvider } from "@/components/parts/CartProvider";
import CartDrawer from "@/components/parts/CartDrawer";
import AddToCartButton from "@/components/parts/AddToCartButton";

export const metadata: Metadata = {
  title: "Premium Grill Parts | Tri-State Grill Cleaning",
  description:
    "OEM-fit replacement burners, cooking grates, electrodes, and heat shields for Alfresco, Lynx, Twin Eagles, DCS, Viking, and other premium built-in grills. Ship to you or have us install it on a visit.",
  alternates: { canonical: `${SITE.canonicalUrl}/parts` },
};

export default function PartsPage({ searchParams }: { searchParams: { canceled?: string } }) {
  const brands = partsByBrand();
  const canceled = searchParams?.canceled === "1";

  return (
    <CartProvider>
      <section className="bg-navy text-bone">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20 text-center">
          <p className="uppercase tracking-widest text-bone/55 text-xs font-semibold">Premium Grill Parts</p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl">Exact-Fit OEM Replacement Parts</h1>
          <p className="mt-5 text-bone/85 max-w-2xl mx-auto">
            Burners, cooking grates, electrodes, and heat shields for the high-end built-ins we service every
            week — Alfresco, Lynx, Twin Eagles, DCS, Viking, and more. Ship it to your door, or have us install
            it on a service visit.
          </p>
        </div>
      </section>

      <section className="bg-bone">
        <div className="mx-auto max-w-6xl px-5 pt-8 pb-2">
          {canceled && (
            <p className="mb-4 rounded-md border border-border bg-white px-4 py-3 text-sm text-ink/75">
              Checkout canceled — your cart is still here whenever you&apos;re ready.
            </p>
          )}
          <p className="text-xs text-ink/60 italic">
            Not sure which part fits? Text us a photo of your grill&apos;s rating plate and the part you need —
            we&apos;ll confirm the exact fit before you buy.
          </p>
        </div>

        <div className="mx-auto max-w-6xl px-5 py-12 space-y-16">
          {brands.length === 0 && (
            <p className="text-center text-ink/60 py-12">
              Parts catalog coming soon — give us a call and we&apos;ll source what you need.
            </p>
          )}

          {brands.map((brand) => (
            <section key={brand.id}>
              <div className="mb-8">
                <p className="uppercase tracking-widest text-burgundy text-xs font-semibold">{brand.label}</p>
                <h2 className="mt-2 font-display text-2xl md:text-3xl text-navy">{brand.blurb}</h2>
              </div>

              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {brand.items.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-col rounded-xl border border-border bg-white shadow-sm transition hover:shadow-md hover:border-burgundy/40 overflow-hidden"
                  >
                    <PartMedia part={p} />

                    <div className="flex flex-col flex-1 p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center rounded-full bg-navy/5 text-navy px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider">
                          {PART_CATEGORY_LABELS[p.category]}
                        </span>
                        {p.featured && (
                          <span className="inline-flex items-center rounded-full bg-burgundy text-bone px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider">
                            Popular
                          </span>
                        )}
                      </div>

                      <h3 className="font-display text-lg text-navy">{p.name}</h3>
                      <p className="mt-1 text-xs text-muted">
                        Part #{p.partNumber} · OEM {p.oemPartNumber}
                      </p>
                      <p className="mt-2 text-sm text-ink/75 leading-relaxed">
                        Fits: {p.modelsFit.join(", ")}
                        {p.dimensions ? ` · ${p.dimensions}` : ""}
                      </p>

                      <div className="mt-5 pt-5 border-t border-border flex items-center justify-between gap-3">
                        <span className="font-display text-xl text-navy">${p.retailPrice}</span>
                        <AddToCartButton part={p} />
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
          <p className="uppercase tracking-widest text-burgundy text-xs font-semibold">Don&apos;t see your part?</p>
          <h2 className="mt-3 font-display text-2xl md:text-3xl text-navy">We can source almost anything.</h2>
          <p className="mt-4 text-ink/75">
            We carry parts for far more grills than we can list. Send us a photo of your rating plate and the part
            you need — we&apos;ll track it down and quote it.
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

      <CartDrawer shippingFee={SHIPPING_FEE} />
    </CartProvider>
  );
}

const CATEGORY_ICONS: Record<PartCategory, JSX.Element> = {
  burners: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-20 w-20 text-bone/85" aria-hidden>
      <rect x="10" y="26" width="44" height="10" rx="5" />
      <path d="M16 26V20M24 26V20M32 26V20M40 26V20M48 26V20" />
      <path d="M14 36l-4 8M50 36l4 8" />
    </svg>
  ),
  grates: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-20 w-20 text-bone/85" aria-hidden>
      <rect x="8" y="14" width="48" height="36" rx="2" />
      <path d="M8 24h48M8 32h48M8 40h48" />
      <path d="M16 14v36M32 14v36M48 14v36" />
    </svg>
  ),
  electrodes: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-20 w-20 text-bone/85" aria-hidden>
      <path d="M34 8 18 36h12l-2 20 18-30H32z" />
    </svg>
  ),
  "heat-shields": (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-20 w-20 text-bone/85" aria-hidden>
      <path d="M32 8c8 4 16 4 16 4v16c0 12-8 20-16 28-8-8-16-16-16-28V12s8 0 16-4z" />
    </svg>
  ),
  "flash-tubes": (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-20 w-20 text-bone/85" aria-hidden>
      <rect x="10" y="28" width="40" height="8" rx="4" />
      <path d="M50 32h6M50 28c4-2 8-2 8-2M50 36c4 2 8 2 8 2" />
    </svg>
  ),
  microswitches: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-20 w-20 text-bone/85" aria-hidden>
      <rect x="14" y="22" width="36" height="20" rx="3" />
      <path d="M24 22v-6h16v6M22 42v6M42 42v6" />
    </svg>
  ),
};

function PartMedia({ part }: { part: Part }) {
  return (
    <div className="relative aspect-[4/3] bg-gradient-to-br from-navy-900 via-navy to-navy-700 flex items-center justify-center overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "repeating-linear-gradient(45deg, #F7F3EE 0 1px, transparent 1px 14px)" }}
      />
      {CATEGORY_ICONS[part.category]}
      <span className="absolute bottom-3 left-3 inline-flex items-center rounded-full bg-bone/10 backdrop-blur-sm text-bone/90 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider">
        {part.brand}
      </span>
    </div>
  );
}
