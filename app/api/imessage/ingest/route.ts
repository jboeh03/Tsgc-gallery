/**
 * POST /api/imessage/ingest
 *
 * Receives a thread context payload from the Mac relay
 * (imessage-relay/relay.js). Verifies the HMAC, runs the Claude
 * classifier, and — only when the stage transitions to "confirmed"
 * for the first time — writes a pending row to Apps Script and pings
 * Jeff with a one-tap confirm URL.
 *
 * Response is small and idempotent enough that the relay can retry on
 * network errors without causing double-pings (we key on the pending id
 * stored locally by the relay).
 */

import { NextRequest, NextResponse } from "next/server";
import { classifyThread } from "@/lib/imessage/classify";
import { sendBookingNotification } from "@/lib/imessage/notify";
import { writePendingBooking } from "@/lib/imessage/appsScript";
import { newPendingId, signConfirmToken, verifyRelayRequest } from "@/lib/imessage/sign";
import { qualifyLead, describeQualification } from "@/lib/leads/qualify";
import type {
  ExtractedBooking,
  IngestRequest,
  IngestResponse,
  PendingBookingPayload,
} from "@/lib/imessage/types";
import type { QualifiedLead } from "@/lib/leads/types";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const CLASSIFY_TIMEOUT_MS = 30_000;

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout after ${ms / 1000}s`)), ms)
    ),
  ]);
}

function originFrom(req: NextRequest): string {
  const env = process.env.APP_ORIGIN;
  if (env) return env.replace(/\/$/, "");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

function formatTranscript(req: IngestRequest, maxLines = 8): string {
  const lines = req.messages.slice(-maxLines).map((m) => {
    const who = m.fromMe ? "Jeff" : req.customerName || "Customer";
    const attach =
      m.attachments.length > 0
        ? ` [${m.attachments.length} attachment${m.attachments.length === 1 ? "" : "s"}]`
        : "";
    const body = (m.text || "").trim() || "(no text)";
    return `${who}: ${body}${attach}`;
  });
  return lines.join("\n");
}

function collectPhotoDataUrls(req: IngestRequest, max = 4): string[] {
  const out: string[] = [];
  for (const m of req.messages) {
    for (const a of m.attachments) {
      if (a.imageBase64 && a.mime.startsWith("image/") && out.length < max) {
        out.push(`data:${a.mime};base64,${a.imageBase64}`);
      }
    }
  }
  return out;
}

function notificationText(args: {
  customerName: string | null;
  customerPhone: string | null;
  summary: string;
  booking: ExtractedBooking;
  qualification: QualifiedLead;
}): { title: string; message: string } {
  const who = args.customerName || args.customerPhone || "New customer";
  const tier = args.qualification.tier.toUpperCase();
  const title = `[${tier} ${args.qualification.score}] ${who}`;
  const b = args.booking;
  const dt = [b.scheduledDate, b.scheduledTimeLabel || b.scheduledStartTime]
    .filter(Boolean)
    .join(" · ");
  const price = b.agreedPriceUsd != null ? `$${b.agreedPriceUsd}` : "(price ?)";
  const grill = b.grillDescription ? `\n${b.grillDescription}` : "";
  const addr = b.address ? `\n${b.address}` : "";
  const notes = b.notes ? `\n📝 ${b.notes}` : "";
  const photos = b.photoCount > 0 ? `\n📷 ${b.photoCount} photo${b.photoCount === 1 ? "" : "s"} in thread` : "";
  const qualLine = `\n⭐ ${describeQualification(args.qualification)}`;
  const message = `${dt || "(date ?)"} — ${price}${grill}${addr}${notes}${photos}${qualLine}\n\n${args.summary}`;
  return { title, message };
}

export async function POST(req: NextRequest) {
  const secret = process.env.IMESSAGE_RELAY_SECRET;
  const confirmSecret = process.env.IMESSAGE_CONFIRM_SECRET;
  if (!secret || !confirmSecret) {
    return NextResponse.json(
      { error: "Server not configured (IMESSAGE_RELAY_SECRET / IMESSAGE_CONFIRM_SECRET)" },
      { status: 500 }
    );
  }

  const rawBody = await req.text();
  const verify = verifyRelayRequest({
    secret,
    rawBody,
    timestampHeader: req.headers.get("x-relay-timestamp"),
    signatureHeader: req.headers.get("x-relay-signature"),
  });
  if (!verify.ok) {
    return NextResponse.json({ error: `Unauthorized: ${verify.reason}` }, { status: 401 });
  }

  let body: IngestRequest;
  try {
    body = JSON.parse(rawBody) as IngestRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.chatGuid || !Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "chatGuid and messages required" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });
  }

  const t0 = Date.now();
  let result;
  try {
    result = await withTimeout(classifyThread(body), CLASSIFY_TIMEOUT_MS, "Claude");
  } catch (err) {
    console.error(
      `[imessage/ingest] classify failed in ${Date.now() - t0}ms`,
      err instanceof Error ? `${err.name}: ${err.message}` : err
    );
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Classifier failed" },
      { status: 502 }
    );
  }
  console.log(
    `[imessage/ingest] chat=${body.chatGuid.slice(0, 8)} stage=${result.stage} (was ${body.priorStage ?? "n/a"}) in ${Date.now() - t0}ms`
  );

  // Only notify on a fresh transition into "confirmed" — never re-notify if
  // the relay still has this thread marked as already notified.
  const isNewlyConfirmed =
    result.stage === "confirmed" &&
    body.priorStage !== "confirmed" &&
    !body.lastNotifiedPendingId;

  if (!isNewlyConfirmed) {
    const resp: IngestResponse = {
      stage: result.stage,
      didNotify: false,
      pendingId: null,
      confirmUrl: null,
      summary: result.summary,
    };
    return NextResponse.json(resp);
  }

  const pendingId = newPendingId();
  const token = signConfirmToken(confirmSecret, {
    pendingId,
    chatGuid: body.chatGuid,
    iat: Date.now(),
  });
  const confirmUrl = `${originFrom(req)}/api/imessage/confirm?token=${encodeURIComponent(token)}`;

  const qualification = await qualifyLead({
    name: result.booking.customerName ?? body.customerName,
    phone: body.customerPhone,
    email: null,
    zip: null,
    address: result.booking.address,
    grillDescription: result.booking.grillDescription,
    estimatedPriceLow: null,
    estimatedPriceHigh: null,
    agreedPriceUsd: result.booking.agreedPriceUsd,
    services: "Grill Cleaning",
    notes: result.booking.notes,
  });
  console.log(
    `[imessage/ingest] qualified pendingId=${pendingId} ${describeQualification(qualification)}`
  );

  const payload: PendingBookingPayload = {
    pendingId,
    chatGuid: body.chatGuid,
    customerName: body.customerName,
    customerPhone: body.customerPhone,
    booking: result.booking,
    transcript: formatTranscript(body),
    photoDataUrls: collectPhotoDataUrls(body),
    qualification,
    createdAt: new Date().toISOString(),
  };

  const writeRes = await writePendingBooking(payload);
  if (!writeRes.ok) {
    console.error(`[imessage/ingest] apps script write failed: ${writeRes.error}`);
    return NextResponse.json(
      { error: `Failed to record pending booking: ${writeRes.error}` },
      { status: 502 }
    );
  }

  const { title, message } = notificationText({
    customerName: body.customerName,
    customerPhone: body.customerPhone,
    summary: result.summary,
    booking: result.booking,
    qualification,
  });

  const notifyRes = await sendBookingNotification({ title, message, confirmUrl });
  if (!notifyRes.sent) {
    console.error(
      `[imessage/ingest] notification (${notifyRes.provider}) not sent: ${notifyRes.error}`
    );
    // Don't fail the request — the pending row was written and Jeff can
    // still confirm from /admin once that page exists. Return the URL
    // anyway so the relay can log it.
  } else {
    console.log(`[imessage/ingest] notified via ${notifyRes.provider} pendingId=${pendingId}`);
  }

  const resp: IngestResponse = {
    stage: result.stage,
    didNotify: notifyRes.sent,
    pendingId,
    confirmUrl,
    summary: result.summary,
  };
  return NextResponse.json(resp);
}
