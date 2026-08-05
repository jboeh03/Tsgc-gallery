import type { Metadata } from "next";
import Link from "next/link";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { fulfillFathersDayBooking } from "@/lib/fathers-day/fulfill";
import { FD_BOOKING_DEPOSIT } from "@/lib/campaign-fathers-day";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "You're booked · Tri-State Grill Cleaning",
  robots: { index: false, follow: false },
};

export default async function FathersDayBookedPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const sessionId = searchParams.session_id;
  let confirmed = false;

  // Reconcile fallback — fulfill here too in case the webhook is delayed.
  // fulfillFathersDayBooking is idempotent (CAS on pending_bookings.fulfilled_at).
  if (sessionId && isStripeConfigured()) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      const pendingId = session.metadata?.tsgc_pending_id;
      if (session.payment_status === "paid" && pendingId) {
        await fulfillFathersDayBooking(pendingId, session.id);
        confirmed = true;
      }
    } catch {
      /* the webhook will handle it */
    }
  }

  return (
    <div className="bg-bone min-h-[60vh]">
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <div className="text-5xl" aria-hidden>🎁</div>
        <h1 className="mt-4 font-display text-3xl text-navy">You&apos;re booked — and Dad&apos;s grill is on the list.</h1>
        <p className="mt-3 text-ink/75">
          Thank you! Your ${FD_BOOKING_DEPOSIT} is in and your receipt is on its way by email. We&apos;ll text to confirm
          the exact window. For a larger / premium grill, that ${FD_BOOKING_DEPOSIT} is a credit toward your full price —
          we&apos;ll confirm any balance as soon as we can.
        </p>
        {!confirmed && (
          <p className="mt-3 text-sm text-muted">
            Finalizing your booking… if you don&apos;t hear from us shortly, just reply to your receipt email.
          </p>
        )}
        <Link href="/" className="mt-8 inline-block rounded-md bg-navy px-5 py-2.5 text-sm uppercase tracking-wider text-bone hover:bg-navy-700">
          Back to site
        </Link>
      </div>
    </div>
  );
}
