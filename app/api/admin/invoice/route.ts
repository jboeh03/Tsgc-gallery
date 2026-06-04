/**
 * Admin-gated: create + send a Stripe invoice for a job, then text the customer
 * the hosted pay link. This is the ONLY path that collects real money, and it
 * runs only when an admin submits an amount — explicit per-action approval.
 */

import { auth, isAdmin } from "@/auth";
import { createInvoiceForJob } from "@/lib/stripe/invoice";
import { isStripeConfigured } from "@/lib/stripe/client";
import { sendSms, isTwilioConfigured } from "@/lib/sms/twilio";
import { logEvent } from "@/lib/db/writes";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isStripeConfigured()) {
    return Response.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const { jobId, amountUsd, description } = (await req.json().catch(() => ({}))) as {
    jobId?: string; amountUsd?: number; description?: string;
  };
  if (!jobId || !amountUsd || amountUsd <= 0) {
    return Response.json({ error: "jobId and a positive amountUsd are required" }, { status: 400 });
  }
  if (amountUsd > 5000) {
    return Response.json({ error: "Amount over $5,000 — double-check before invoicing this much." }, { status: 400 });
  }

  try {
    const result = await createInvoiceForJob({ jobId, amountUsd, description, sendNow: true });

    // Text the customer the hosted pay link (Stripe also emails it).
    if (isTwilioConfigured() && result.customerPhone && result.hostedUrl) {
      try {
        await sendSms({
          to: result.customerPhone,
          body: `Your invoice from ${SITE.name} is ready — pay securely here: ${result.hostedUrl} . Thanks! Reply STOP to opt out.`,
        });
      } catch { /* best-effort */ }
    }

    await logEvent("status_change", { jobId }, { via: "invoice", invoiceId: result.invoiceId, amountUsd });
    return Response.json({ ok: true, hostedUrl: result.hostedUrl, invoiceId: result.invoiceId });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Invoice failed" }, { status: 500 });
  }
}
