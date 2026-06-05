/**
 * Weber sprint booking REQUEST (review-then-send model). Captures the customer's
 * details + photo + preferred slot, stores the photo, creates a "quoted" job in
 * the CRM with a suggested price + assessment, and pings Jeff. He reviews in
 * /admin and sends the payment link (existing invoice flow). On payment the
 * invoice webhook creates the confirmed appointment + calendar event.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured } from "@/lib/db/supabase";
import { upsertContactByPhone, logEvent } from "@/lib/db/writes";
import { normalizeE164 } from "@/lib/db/ingest";
import { priceQuote, isWeberSprintActive, type WeberModel } from "@/lib/campaign-weber";
import { publicFormAllowed, clientIp } from "@/lib/ratelimit";
import { sendSms, isTwilioConfigured } from "@/lib/sms/twilio";
import { sendPush } from "@/lib/imessage/notify";
import { SITE } from "@/lib/site";
import type { JobRow } from "@/lib/db/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const NOTIFY_TO = process.env.ALERT_TO || process.env.BOOKING_NOTIFY_TO || "+16578314276";

export async function POST(req: NextRequest) {
  if (!isWeberSprintActive()) return NextResponse.json({ error: "The Weber sprint has ended." }, { status: 410 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Booking is temporarily unavailable." }, { status: 503 });

  const b = (await req.json().catch(() => ({}))) as {
    firstName?: string; lastName?: string; phone?: string; email?: string;
    serviceAddress?: string; preferredDate?: string; preferredTime?: string;
    model?: WeberModel; burners?: number; neighbor?: boolean;
    assessment?: Record<string, unknown>;
    imageBase64?: string; imageMimeType?: string;
  };

  const phone = normalizeE164(b.phone);
  const email = (b.email ?? "").trim();
  const serviceAddress = (b.serviceAddress ?? "").trim();
  const preferredDate = (b.preferredDate ?? "").trim();
  if (!phone) return NextResponse.json({ error: "A valid phone number is required." }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  if (!serviceAddress) return NextResponse.json({ error: "Service address is required." }, { status: 400 });
  if (!preferredDate) return NextResponse.json({ error: "Pick a preferred date." }, { status: 400 });

  if (!(await publicFormAllowed("weber-request", clientIp(req), phone))) {
    return NextResponse.json({ error: "Too many tries — give it a minute." }, { status: 429 });
  }

  const burners = Number(b.burners) || 4;
  const neighbor = Boolean(b.neighbor);
  const q = priceQuote({ burners, neighbor });
  const model = (b.model ?? "Other") as WeberModel;
  const name = [b.firstName, b.lastName].filter(Boolean).join(" ").trim() || null;

  try {
    const sb = getSupabase();

    // Store the photo (best-effort) so Jeff can see it when reviewing.
    let photoUrl: string | null = null;
    if (b.imageBase64 && b.imageMimeType) {
      try {
        const ext = b.imageMimeType.includes("png") ? "png" : b.imageMimeType.includes("webp") ? "webp" : "jpg";
        const path = `req-${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
        const buf = Buffer.from(b.imageBase64, "base64");
        const { error: upErr } = await sb.storage.from("weber-photos").upload(path, buf, { contentType: b.imageMimeType });
        if (!upErr) photoUrl = sb.storage.from("weber-photos").getPublicUrl(path).data.publicUrl;
      } catch { /* photo is best-effort */ }
    }

    const a = b.assessment ?? {};
    const assessmentNote = [
      typeof a.conditionSeverity === "string" ? `Condition: ${a.conditionSeverity}` : "",
      Array.isArray(a.conditionIssues) ? `Issues: ${(a.conditionIssues as string[]).join("; ")}` : "",
      typeof a.recommendation === "string" ? a.recommendation : "",
    ].filter(Boolean).join("\n");

    const contact = await upsertContactByPhone(phone, {
      name, email, service_address: serviceAddress,
      grill_brand: "Weber", grill_model: `Weber ${model}`, grill_burner_count: burners,
      source: "weber-sprint",
    }, { markConsent: true });

    const notes = [
      "🔥 WEBER SPRINT REQUEST — review + send a payment link.",
      `Suggested: $${q.discountedPrice} (${q.discountPercent}% off $${q.basePrice})`,
      `Preferred: ${preferredDate}${b.preferredTime ? ` · ${b.preferredTime}` : ""}`,
      `Neighbor/friend within 5mi: ${neighbor ? "yes (30%)" : "no (15%)"}`,
      assessmentNote,
      photoUrl ? `Photo: ${photoUrl}` : "Photo: (upload failed)",
    ].filter(Boolean).join("\n");

    const jobInsert: Partial<JobRow> = {
      contact_id: contact.id,
      status: "quoted",
      source: "weber-sprint",
      service: "Weber deep clean",
      grill_brand: "Weber",
      grill_model: `Weber ${model}`,
      burner_count: burners,
      quote_amount: q.discountedPrice,
      date_quoted: new Date().toISOString().slice(0, 10),
      date_booked: preferredDate, // requested slot; appointment is created on payment
      job_address: serviceAddress,
      notes,
    };
    const { data: jobRow, error: jobErr } = await sb.from("jobs").insert(jobInsert).select("id").single();
    if (jobErr || !jobRow) throw new Error(jobErr?.message ?? "could not save request");
    const jobId = (jobRow as { id: string }).id;

    await logEvent("lead_created", { contactId: contact.id, jobId }, {
      via: "weber-sprint", suggested: q.discountedPrice, neighbor, preferredDate,
    });

    // Ping Jeff to review + send the link.
    const summary = `🔥 Weber request — ${name ?? phone} · ${model} ${burners}-burner · suggest $${q.discountedPrice} · ${preferredDate}`;
    if (isTwilioConfigured()) { try { await sendSms({ to: NOTIFY_TO, body: summary.slice(0, 320) }); } catch { /* best-effort */ } }

    // Email/text Jeff via the same Apps Script the website quote form uses
    // (GmailApp → NOTIFY_EMAIL + the email-to-SMS gateway), so notifications
    // arrive even while Twilio A2P is pending. Best-effort, non-blocking.
    try {
      const zip = serviceAddress.match(/\b(\d{5})\b/)?.[1] ?? "";
      await fetch(SITE.quoteEndpoint, {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: JSON.stringify({
          name: name ?? "",
          email,
          phone,
          services: "Weber deep clean",
          grillModel: `Weber ${model} · ${burners}-burner`,
          serviceAddress,
          zip,
          source: "weber-sprint",
          notes,
          timestamp: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(8000),
      });
    } catch { /* best-effort */ }

    try {
      await sendPush({
        title: "New Weber request",
        message: `${name ?? phone} · ${model} · suggest $${q.discountedPrice}`,
        url: `${SITE.canonicalUrl.replace(/\/$/, "")}/admin/leads/${jobId}`,
        urlTitle: "Review + send link",
        tags: "fire",
      });
    } catch { /* best-effort */ }

    return NextResponse.json({ ok: true, estimate: q.discountedPrice });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not submit your request." }, { status: 500 });
  }
}
