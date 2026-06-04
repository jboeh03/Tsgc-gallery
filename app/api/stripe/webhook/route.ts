/**
 * Stripe webhook — marks a job paid when its invoice is paid. Verifies the
 * Stripe signature (STRIPE_WEBHOOK_SECRET). Add the endpoint in the Stripe
 * dashboard pointing at /api/stripe/webhook for the `invoice.paid` event, then
 * set STRIPE_WEBHOOK_SECRET on Vercel.
 */

import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { updateJob, logEvent } from "@/lib/db/writes";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!isStripeConfigured() || !secret) {
    return new Response("not configured", { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();

  let event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig ?? "", secret);
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
      }
    }
  } catch {
    /* swallow — ack the event so Stripe doesn't retry-storm; reprocessing is safe */
  }

  return Response.json({ received: true });
}
