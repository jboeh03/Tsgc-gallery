/**
 * Create a Stripe invoice for a job and (optionally) send it.
 *
 * `sendNow: false` leaves the invoice as a DRAFT — nothing is charged, no email
 * goes out — which is how we verify the flow safely on the live account.
 * `sendNow: true` finalizes + emails the customer a hosted pay page; that's the
 * only path that can collect real money, and it only runs from an explicit
 * admin action with an amount.
 */

import { getStripe } from "./client";
import { getSupabase } from "@/lib/db/supabase";
import { updateJob } from "@/lib/db/writes";
import type { ContactRow } from "@/lib/db/types";

export type InvoiceResult = {
  invoiceId: string;
  status: string;
  draft: boolean;
  hostedUrl: string | null;
  customerPhone: string | null;
};

async function loadJobContact(jobId: string): Promise<{ job: { id: string }; contact: ContactRow } | null> {
  const { data } = await getSupabase()
    .from("jobs")
    .select("id, contact:contacts(*)")
    .eq("id", jobId)
    .maybeSingle();
  const row = data as unknown as { id: string; contact: ContactRow | null } | null;
  if (!row || !row.contact) return null;
  return { job: { id: row.id }, contact: row.contact };
}

async function findOrCreateCustomer(contact: ContactRow): Promise<string> {
  const stripe = getStripe();
  if (contact.email) {
    const existing = await stripe.customers.list({ email: contact.email, limit: 1 });
    if (existing.data[0]) return existing.data[0].id;
  }
  const created = await stripe.customers.create({
    name: contact.name ?? undefined,
    email: contact.email ?? undefined,
    phone: contact.phone_e164 ?? undefined,
    metadata: { tsgc_contact_id: contact.id },
  });
  return created.id;
}

export async function createInvoiceForJob(input: {
  jobId: string;
  amountUsd: number;
  description?: string;
  sendNow: boolean;
}): Promise<InvoiceResult> {
  const stripe = getStripe();
  const jc = await loadJobContact(input.jobId);
  if (!jc) throw new Error("Job or contact not found");
  if (input.sendNow && !jc.contact.email) {
    throw new Error("Customer has no email on file — needed to send a Stripe invoice.");
  }
  const cents = Math.round(input.amountUsd * 100);
  if (!Number.isFinite(cents) || cents <= 0) throw new Error("Invalid amount");

  const customerId = await findOrCreateCustomer(jc.contact);

  await stripe.invoiceItems.create({
    customer: customerId,
    amount: cents,
    currency: "usd",
    description: input.description || "Grill cleaning service — Tri-State Grill Cleaning",
  });

  const invoice = await stripe.invoices.create({
    customer: customerId,
    collection_method: "send_invoice",
    days_until_due: 7,
    auto_advance: true,
    pending_invoice_items_behavior: "include",
    metadata: { tsgc_job_id: input.jobId, tsgc_contact_id: jc.contact.id },
  });

  let status = invoice.status ?? "draft";
  let hostedUrl: string | null = null;

  if (input.sendNow) {
    const finalized = await stripe.invoices.finalizeInvoice(invoice.id as string);
    await stripe.invoices.sendInvoice(invoice.id as string);
    status = finalized.status ?? "open";
    hostedUrl = finalized.hosted_invoice_url ?? null;
    await updateJob(input.jobId, {
      status: "invoiced",
      invoice_num: finalized.number ?? finalized.id,
      invoice_amount: input.amountUsd,
    });
  }

  return {
    invoiceId: invoice.id as string,
    status,
    draft: !input.sendNow,
    hostedUrl,
    customerPhone: jc.contact.phone_e164,
  };
}

/** Delete a draft invoice (used to clean up after a non-charging verification). */
export async function deleteDraftInvoice(invoiceId: string): Promise<void> {
  await getStripe().invoices.del(invoiceId);
}
