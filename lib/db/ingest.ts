/**
 * Dual-write lead ingest. The website still POSTs every lead to the Apps Script
 * (which keeps Jeff's Sheet + email/SMS alerts working untouched); this ADDS a
 * parallel write into Supabase so /admin and the comms inbox have the lead too.
 *
 * Fail-soft: a no-op when Supabase isn't configured, and callers fire it
 * best-effort so a Supabase hiccup never blocks the lead reaching the Sheet.
 */

import { getSupabase, isSupabaseConfigured } from "./supabase";
import { upsertContactByPhone, logEvent } from "./writes";
import type { ContactRow, JobRow } from "./types";

export type LeadInput = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  zip?: string;
  services?: string[] | string;
  grillModel?: string;
  source?: string;
  referredBy?: string;
  bestTime?: string;
  promoCode?: string;
  notes?: string;
  legacyLeadId?: string;
};

/** Best-effort US E.164 normalization. Returns null if it can't form 10/11 digits. */
export function normalizeE164(raw?: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (raw.trim().startsWith("+")) return raw.trim();
  return null;
}

export async function ingestLead(input: LeadInput): Promise<{ contactId: string; jobId: string } | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const sb = getSupabase();
    const phone = normalizeE164(input.phone);
    const name = [input.firstName, input.lastName].filter(Boolean).join(" ").trim() || null;
    const services = Array.isArray(input.services)
      ? input.services.filter(Boolean).join(", ")
      : input.services || "";
    const notes = [input.notes, input.promoCode ? `Promo: ${input.promoCode}` : null]
      .filter(Boolean)
      .join("\n") || null;

    const contactFields: Partial<ContactRow> = {
      name,
      email: input.email || null,
      zip: input.zip || null,
      grill_model: input.grillModel || null,
      source: input.source || "website-quote-form",
      referred_by: input.referredBy || null,
      legacy_lead_id: input.legacyLeadId || null,
    };

    let contactId: string;
    if (phone) {
      const c = await upsertContactByPhone(phone, contactFields);
      contactId = c.id;
    } else {
      // No phone (e.g. the AI preview tool captures email only) — insert fresh.
      const { data, error } = await sb.from("contacts").insert(contactFields).select("id").single();
      if (error) throw new Error(error.message);
      contactId = (data as { id: string }).id;
    }

    const jobInsert: Partial<JobRow> = {
      contact_id: contactId,
      status: "new",
      service: services || null,
      source: input.source || "website-quote-form",
      referred_by: input.referredBy || null,
      notes,
      grill_model: input.grillModel || null,
      legacy_lead_id: input.legacyLeadId || null,
    };
    const { data: job, error: jobErr } = await sb.from("jobs").insert(jobInsert).select("id").single();
    if (jobErr) throw new Error(jobErr.message);
    const jobId = (job as { id: string }).id;

    await logEvent("lead_created", { contactId, jobId }, {
      source: input.source,
      promoCode: input.promoCode || null,
    });
    return { contactId, jobId };
  } catch {
    return null; // best-effort — never throw into the lead-capture path
  }
}
