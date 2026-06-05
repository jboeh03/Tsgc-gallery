/**
 * Dual-write lead ingest. The website still POSTs every lead to the Apps Script
 * (which keeps Jeff's Sheet + email/SMS alerts working untouched); this ADDS a
 * parallel write into Supabase so /admin and the comms inbox have the lead too.
 *
 * Fail-soft: a no-op when Supabase isn't configured, and callers fire it
 * best-effort so a Supabase hiccup never blocks the lead reaching the Sheet.
 */

import { revalidateTag } from "next/cache";
import { getSupabase, isSupabaseConfigured } from "./supabase";
import { upsertContactByPhone, logEvent, getOrCreateConversation, setSuggestedDraft } from "./writes";
import { computeMissingFields } from "@/lib/comms/missingFields";
import { draftFollowupOpener } from "@/lib/comms/followup";
import { sendSms, isTwilioConfigured } from "@/lib/sms/twilio";
import { sendPush } from "@/lib/imessage/notify";
import { SITE } from "@/lib/site";
import type { ContactRow, JobRow } from "./types";

export type LeadInput = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  zip?: string;
  serviceAddress?: string;
  services?: string[] | string;
  grillModel?: string;
  source?: string;
  referredBy?: string;
  bestTime?: string;
  promoCode?: string;
  notes?: string;
  preferredContact?: string;
  legacyLeadId?: string;
  imageBase64?: string;
  imageMimeType?: string;
};

/** Upload an optional quote photo to storage; returns a public URL or null. */
async function uploadQuotePhoto(base64?: string, mime?: string): Promise<string | null> {
  if (!base64 || !mime || !isSupabaseConfigured()) return null;
  try {
    const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
    const path = `lead-${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
    const sb = getSupabase();
    const { error } = await sb.storage.from("weber-photos").upload(path, Buffer.from(base64, "base64"), { contentType: mime });
    if (error) return null;
    return sb.storage.from("weber-photos").getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}

const NOTIFY_TO = process.env.BOOKING_NOTIFY_TO || "+16578314276";

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
    const photoUrl = await uploadQuotePhoto(input.imageBase64, input.imageMimeType);
    const notes = [input.notes, input.promoCode ? `Promo: ${input.promoCode}` : null, photoUrl ? `Photo: ${photoUrl}` : null]
      .filter(Boolean)
      .join("\n") || null;

    const contactFields: Partial<ContactRow> = {
      name,
      email: input.email || null,
      zip: input.zip || null,
      service_address: input.serviceAddress || null,
      grill_model: input.grillModel || null,
      source: input.source || "website-quote-form",
      referred_by: input.referredBy || null,
      preferred_contact: input.preferredContact || null,
      legacy_lead_id: input.legacyLeadId || null,
    };

    let contactId: string;
    let contactRow: ContactRow | null = null;
    if (phone) {
      contactRow = await upsertContactByPhone(phone, contactFields);
      contactId = contactRow.id;
    } else {
      // No phone (e.g. the AI preview tool captures email only) — insert fresh.
      const { data, error } = await sb.from("contacts").insert(contactFields).select("*").single();
      if (error) throw new Error(error.message);
      contactRow = data as ContactRow;
      contactId = contactRow.id;
    }

    // Dedup: if this contact already opened a job in the last 24h (double-submit,
    // retry, accidental double-click), reuse it instead of creating a duplicate.
    const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
    const { data: recent } = await sb
      .from("jobs")
      .select("id")
      .eq("contact_id", contactId)
      .gte("created_at", dayAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const isNewJob = !recent;
    let jobId: string;
    if (recent) {
      jobId = (recent as { id: string }).id;
    } else {
      const jobInsert: Partial<JobRow> = {
        contact_id: contactId,
        status: "new",
        service: services || null,
        source: input.source || "website-quote-form",
        referred_by: input.referredBy || null,
        notes,
        grill_model: input.grillModel || null,
        job_address: input.serviceAddress || null,
        legacy_lead_id: input.legacyLeadId || null,
      };
      const { data: job, error: jobErr } = await sb.from("jobs").insert(jobInsert).select("id").single();
      if (jobErr) throw new Error(jobErr.message);
      jobId = (job as { id: string }).id;
    }

    await logEvent("lead_created", { contactId, jobId }, {
      source: input.source,
      promoCode: input.promoCode || null,
    });

    // Human-in-the-loop follow-up: if they can be texted (preference is Text/
    // Either, or unspecified) and gave a phone, draft an opener that asks for
    // the missing quote info and drop it in the inbox. He reviews and presses
    // send — the natural delay keeps it from feeling automated.
    let draftQueued = false;
    const pref = (input.preferredContact || "").toLowerCase();
    if (phone && contactRow && pref !== "email") {
      try {
        const twilioNumber = process.env.TWILIO_PHONE_NUMBER || "+15137904040";
        const conv = await getOrCreateConversation(contactId, twilioNumber);
        const missing = computeMissingFields(contactRow, { hasPhoto: false });
        const opener = await draftFollowupOpener(contactRow, missing);
        if (opener) {
          await setSuggestedDraft({
            conversationId: conv.id,
            body: opener,
            missingFields: missing,
            model: "claude-haiku-4-5",
          });
          await sb
            .from("conversations")
            .update({ unread: true, last_message_at: new Date().toISOString() })
            .eq("id", conv.id);
          draftQueued = true;
          revalidateTag("admin-inbox");
        }
      } catch { /* best-effort — follow-up is a bonus, never blocks the lead */ }
    }

    // Alert Jeff on EVERY genuinely-new lead — push + text, unconditionally
    // (not gated on phone/preference/AI like the old behavior). Skipped on
    // 24h-dedup re-submits so double-clicks don't double-ping.
    if (isNewJob) {
      const bits = [name, services || null, input.zip || null].filter(Boolean).join(" · ");
      const summary = `🌐 New lead — ${bits || "details in HQ"}.${draftQueued ? " Follow-up drafted — review & send." : ""}`;
      const url = `${SITE.canonicalUrl.replace(/\/$/, "")}${draftQueued ? "/admin/inbox" : "/admin/leads"}`;
      if (isTwilioConfigured()) {
        try { await sendSms({ to: NOTIFY_TO, body: summary.slice(0, 320) }); } catch { /* best-effort */ }
      }
      try {
        await sendPush({
          title: "New website lead",
          message: bits || "Open HQ for details",
          url,
          urlTitle: draftQueued ? "Review follow-up" : "Open CRM",
          tags: "globe_with_meridians",
        });
      } catch { /* best-effort */ }
    }

    return { contactId, jobId };
  } catch (err) {
    // Never throw into the lead-capture path — but a lost lead is worth knowing about.
    const { logError } = await import("@/lib/observability");
    await logError("lead_ingest", err, { critical: true });
    return null;
  }
}
