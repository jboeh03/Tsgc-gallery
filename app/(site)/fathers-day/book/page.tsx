import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FATHERS_DAY,
  isFathersDayActive,
  FD_BOOKING_DEPOSIT,
} from "@/lib/campaign-fathers-day";
import { getFathersDayAvailability } from "@/lib/fathers-day/availability";
import { SITE } from "@/lib/site";
import FathersDayBookingForm from "@/components/fathers-day/FathersDayBookingForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Book your Father's Day grill clean | ${SITE.name}`,
  robots: { index: false, follow: false },
};

export default async function FathersDayBookPage({
  searchParams,
}: {
  searchParams: { deal?: string; canceled?: string };
}) {
  if (!isFathersDayActive()) redirect("/fathers-day");

  const deal = searchParams.deal === "bundle" ? "bundle" : "single";
  const tier = FATHERS_DAY.tiers.find((t) => (deal === "bundle" ? t.id === "bogo" : t.id === "single"))!;
  const availability = deal === "single" ? await getFathersDayAvailability() : [];

  return (
    <div className="bg-bone min-h-[70vh]">
      <section className="bg-navy text-bone">
        <div className="mx-auto max-w-3xl px-5 py-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200">
            Father&apos;s Day · {tier.label}
          </p>
          <h1 className="mt-3 font-display text-3xl md:text-4xl">
            {deal === "bundle" ? "Book the Bundle — two grills, one visit" : "Book Dad's deep clean"}
          </h1>
          <p className="mt-3 text-bone/85">
            {deal === "bundle"
              ? "Tell us about both grills and we'll confirm your bundle price (2nd grill 50% off) and schedule."
              : `25% off any cleaning. Pay $${FD_BOOKING_DEPOSIT} now to lock your spot, or just send a quote request.`}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-5 py-10">
        <FathersDayBookingForm
          deal={deal}
          dealCode={tier.code}
          deposit={FD_BOOKING_DEPOSIT}
          availability={availability}
          canceled={searchParams.canceled === "1"}
        />
        <p className="mt-4 text-center text-xs text-muted">
          Looking for the other offer?{" "}
          <Link href={`/fathers-day/book?deal=${deal === "bundle" ? "single" : "bundle"}`} className="text-navy underline">
            {deal === "bundle" ? "Single grill — 25% off" : "The Bundle — 2nd grill 50% off"}
          </Link>
        </p>
      </section>
    </div>
  );
}
