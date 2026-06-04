import type { Metadata } from "next";
import Link from "next/link";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { fulfillWeberBooking } from "@/lib/weber/fulfill";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "You're booked · Tri-State Grill Cleaning",
  robots: { index: false, follow: false },
};

export default async function WeberSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const sessionId = searchParams.session_id;
  let confirmed = false;

  // Reconcile fallback — fulfill here too in case the webhook is delayed.
  // fulfillWeberBooking is idempotent (CAS on pending_bookings.fulfilled_at).
  if (sessionId && isStripeConfigured()) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      const pendingId = session.metadata?.tsgc_pending_id;
      if (session.payment_status === "paid" && pendingId) {
        await fulfillWeberBooking(pendingId, session.id);
        confirmed = true;
      }
    } catch {
      /* the webhook will handle it */
    }
  }

  return (
    <div className="bg-bone min-h-[60vh]">
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <div className="text-5xl" aria-hidden>🔥</div>
        <h1 className="mt-4 font-display text-3xl text-navy">You&apos;re booked — and paid in full.</h1>
        <p className="mt-3 text-ink/75">
          Thank you! Your Weber clean is on the schedule. We&apos;ll text you to confirm the exact window,
          and your receipt is on its way by email.
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
