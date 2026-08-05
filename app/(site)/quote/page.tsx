import type { Metadata } from "next";
import { Suspense } from "react";
import QuoteForm from "@/components/QuoteForm";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `Get a Free Quote | ${SITE.name} — Cincinnati, NKY & Dayton`,
  description: `Get a free grill cleaning quote from ${SITE.name}. Serving Cincinnati, Northern Kentucky, and Dayton. Fill out our quick form or call ${SITE.phone}.`,
};

export default function QuotePage() {
  return (
    <>
      <section className="bg-navy text-bone">
        <div className="mx-auto max-w-4xl px-5 py-16 md:py-20 text-center">
          <p className="uppercase tracking-widest text-bone/55 text-xs font-semibold">
            Free Quote
          </p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl">
            Let&apos;s Get Your Grill Clean
          </h1>
          <p className="mt-5 text-bone/85 max-w-2xl mx-auto">
            Fill out the short form below and we&apos;ll follow up as soon as we
            can. No commitment, no pressure.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-12 md:py-16 grid gap-12 lg:grid-cols-[1.4fr_1fr] items-start">
          <div className="rounded-xl border border-border bg-white shadow-sm p-6 md:p-8">
            <Suspense fallback={null}>
              <QuoteForm />
            </Suspense>
          </div>

          <aside>
            <p className="uppercase tracking-widest text-burgundy text-xs font-semibold">
              Contact Us Directly
            </p>
            <h2 className="mt-3 font-display text-2xl md:text-3xl text-navy">
              We&apos;d Love to Hear From You
            </h2>
            <p className="mt-4 text-ink/75 text-sm">
              Prefer to skip the form? Call or text us directly. Jeff answers
              personally during business hours.
            </p>

            <div className="mt-6 space-y-4">
              <a
                href={SITE.phoneHref}
                className="flex items-center gap-4 rounded-md border border-border px-5 py-4 hover:shadow-md transition"
              >
                <span className="h-11 w-11 rounded-md bg-navy text-bone flex items-center justify-center text-xl shrink-0">
                  ☎
                </span>
                <div>
                  <span className="block text-xs uppercase tracking-widest text-muted">
                    Call or Text
                  </span>
                  <span className="font-display text-lg text-navy">
                    {SITE.phone}
                  </span>
                </div>
              </a>
              <a
                href={SITE.emailHref}
                className="flex items-center gap-4 rounded-md border border-border px-5 py-4 hover:shadow-md transition"
              >
                <span className="h-11 w-11 rounded-md bg-navy text-bone flex items-center justify-center text-lg shrink-0">
                  ✉
                </span>
                <div>
                  <span className="block text-xs uppercase tracking-widest text-muted">
                    Email
                  </span>
                  <span className="font-display text-base text-navy">
                    {SITE.email}
                  </span>
                </div>
              </a>
            </div>

            <div className="mt-8 rounded-xl bg-bone border border-border p-6">
              <h3 className="font-display text-base text-navy">Service Area</h3>
              <p className="mt-2 text-sm text-ink/75 leading-relaxed">
                We serve Greater Cincinnati, Northern Kentucky, and Dayton. Not
                sure if you&apos;re in our area? Just ask — we&apos;ll let you
                know.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {SITE.serviceArea.map((a) => (
                  <span
                    key={a}
                    className="rounded-full bg-white border border-border px-3 py-1 text-xs text-navy"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <a
                href={SITE.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center rounded-md border border-border px-3 py-3 font-display text-xs uppercase tracking-widest text-navy hover:bg-bone"
              >
                Facebook
              </a>
              <a
                href={SITE.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center rounded-md border border-border px-3 py-3 font-display text-xs uppercase tracking-widest text-navy hover:bg-bone"
              >
                Instagram
              </a>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
