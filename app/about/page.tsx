import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About · Tri-State Grill Cleaning",
  description:
    "Veteran-founded grill cleaning serving Cincinnati, Northern Kentucky, and Dayton.",
};

export default function AboutPage() {
  return (
    <>
      <section className="bg-navy text-bone">
        <div className="mx-auto max-w-4xl px-5 py-16 md:py-20">
          <p className="uppercase tracking-widest text-burgundy-400 text-xs font-semibold">
            About
          </p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl">
            Veteran-founded. Locally run. Built around doing the work right.
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-12 md:py-16 space-y-6 text-ink/85 text-lg leading-relaxed">
        <p>
          {SITE.name} started for one reason: most homeowners in the
          Tri-State were being told their grill was &ldquo;past its prime&rdquo;
          when in fact it just needed somebody willing to break it down and
          clean it properly.
        </p>
        <p>
          Our founder served in the US military, where the rule was simple:
          you don&apos;t hand back equipment until it&apos;s better than you
          got it. That standard is the company. Every job is documented. Every
          surface is degreased. Every fastener goes back to spec.
        </p>
        <p>
          We work on driveways, decks, patios, dockside, and rooftop kitchens
          across Cincinnati, Northern Kentucky, and Dayton. Most of our
          business comes from referrals — neighbors who watched us pull a
          neighbor&apos;s grill apart and decided they wanted theirs done too.
        </p>
        <p>
          If you&apos;ve been thinking about replacing your grill, talk to us
          first. There&apos;s a good chance we can put it back to day-one
          condition for a fraction of the cost — and the {" "}
          <Link href="/gallery" className="text-burgundy underline">
            gallery page
          </Link>{" "}
          is full of grills we did exactly that for.
        </p>
      </section>

      <section className="bg-white border-t border-navy/10">
        <div className="mx-auto max-w-4xl px-5 py-12 md:py-16 grid md:grid-cols-3 gap-6">
          <Value
            title="Honest pricing"
            body="The number you get on the phone is the number on the invoice. No day-of upcharges."
          />
          <Value
            title="Trained, insured, on time"
            body="Background-checked techs, fully insured, communicative — we don't ghost."
          />
          <Value
            title="Built to last"
            body="If we touch it, it comes with a 30-day satisfaction guarantee. If something's off, we come back."
          />
        </div>
      </section>

      <section className="bg-burgundy text-bone">
        <div className="mx-auto max-w-4xl px-5 py-14 text-center">
          <h2 className="font-display text-2xl md:text-3xl">
            Want to talk to a human?
          </h2>
          <p className="mt-3 text-bone/90">
            Call or text us anytime during business hours.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href={SITE.phoneHref}
              className="rounded-md bg-bone text-burgundy px-6 py-3 font-semibold hover:bg-white shadow"
            >
              {SITE.phone}
            </a>
            <Link
              href="/quote"
              className="rounded-md border border-bone/40 px-6 py-3 font-semibold hover:bg-bone/10"
            >
              Or send a quote request
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Value({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-navy/10 bg-bone p-6">
      <p className="font-display text-xl text-navy">{title}</p>
      <p className="mt-2 text-sm text-ink/75">{body}</p>
    </div>
  );
}
