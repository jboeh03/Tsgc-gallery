/**
 * Stripe webhook — marks a job paid when its invoice is paid. Verifies the
 * Stripe signature (STRIPE_WEBHOOK_SECRET). Add the endpoint in the Stripe
 * dashboard pointing at /api/stripe/webhook for the `invoice.paid` event, then
 * set STRIPE_WEBHOOK_SECRET on Vercel.
 */

import type Stripe from "stripe";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { updateJob, logEvent } from "@/lib/db/writes";
import { fulfillWeberBooking, scheduleWeberJob } from "@/lib/weber/fulfill";
import { logError } from "@/lib/observability";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!isStripeConfigured() || !secret) {
    return new Response("not configured", { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("missing signature", { status: 400 });
  const raw = await req.text();

  let event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig, secret);
  } catch {
    return new Response("bad signature", { status: 400 });
  }

  try {
    if (event.type === "invoice.paid" || event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as { metadata?: Record<string, string> | null };
      const jobId = invoice.metadata?.tsgc_job_id;
      if (jobId) {
        await updateJob(jobId, {
          status: "paid",
          date_paid: new Date().toISOString().slice(0, 10),
          pay_method: "stripe",
        });
        await logEvent("status_change", { jobId }, { via: "stripe_webhook", event: event.type });
        // Weber-sprint review-then-send: a paid invoice puts the job on the schedule.
        await scheduleWeberJob(jobId);
      }
    } else if (event.type === "checkout.session.completed") {
      // Weber-sprint self-serve booking — fulfill the paid slot (idempotent).
      const session = event.data.object as Stripe.Checkout.Session;
      const pendingId = session.metadata?.tsgc_pending_id;
      if (pendingId && session.payment_status === "paid") {
        await fulfillWeberBooking(pendingId, session.id);
      }
    }
  } catch (err) {
    // Ack anyway so Stripe doesn't retry-storm, but surface the failure.
    await logError("stripe_webhook", err, { critical: true });
  }

  return Response.json({ received: true });
}
