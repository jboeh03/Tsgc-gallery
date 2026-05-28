/**
 * GET /api/imessage/confirm?token=<signed>
 *
 * One-tap handler Jeff opens from the push notification. Verifies the
 * HMAC token, asks Apps Script to materialize the pending row into a
 * real Google Calendar event on the TSGC schedule calendar AND append
 * it to the CRM tab, then renders a tiny success page.
 *
 * GET (not POST) on purpose — the link comes from a notification action
 * and needs to work with a single tap. The token is short-lived (7d)
 * and single-purpose (only flips a specific pendingId), so the safety
 * trade-off is acceptable for an admin-only flow.
 */

import { NextRequest, NextResponse } from "next/server";
import { confirmBookingInAppsScript } from "@/lib/imessage/appsScript";
import { verifyConfirmToken } from "@/lib/imessage/sign";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function htmlResponse(status: number, title: string, body: string): NextResponse {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${title}</title>
<style>
:root { color-scheme: light dark; }
body { font: 16px/1.5 -apple-system, BlinkMacSystemFont, system-ui, sans-serif; margin: 0; padding: 2rem; display: flex; min-height: 100vh; align-items: center; justify-content: center; background: #f7f5f0; color: #1a1a1a; }
.card { max-width: 28rem; width: 100%; background: #fff; border: 1px solid #e6e2d8; border-radius: 14px; padding: 2rem; box-shadow: 0 1px 2px rgba(0,0,0,.04); }
h1 { margin: 0 0 .5rem; font-size: 1.25rem; }
.muted { color: #6b6b6b; font-size: .9rem; }
.ok { color: #1f7a3a; font-weight: 600; }
.err { color: #b3261e; font-weight: 600; }
a { color: #5a1a2a; }
</style>
</head>
<body><div class="card">${body}</div></body>
</html>`;
  return new NextResponse(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export async function GET(req: NextRequest) {
  const secret = process.env.IMESSAGE_CONFIRM_SECRET;
  if (!secret) {
    return htmlResponse(
      500,
      "Server misconfigured",
      `<h1 class="err">Server misconfigured</h1><p class="muted">IMESSAGE_CONFIRM_SECRET is not set.</p>`
    );
  }
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return htmlResponse(
      400,
      "Missing token",
      `<h1 class="err">Missing token</h1><p class="muted">This link is malformed.</p>`
    );
  }
  const verify = verifyConfirmToken(secret, token);
  if (!verify.ok) {
    return htmlResponse(
      401,
      "Link rejected",
      `<h1 class="err">Link rejected</h1><p class="muted">Reason: ${verify.reason}. If the link is older than 7 days, re-send the booking from the iMessage thread.</p>`
    );
  }

  const result = await confirmBookingInAppsScript(verify.payload.pendingId);
  if (!result.ok) {
    return htmlResponse(
      502,
      "Apps Script error",
      `<h1 class="err">Couldn't add to calendar</h1><p class="muted">${result.error ?? "Unknown error"}</p><p class="muted">The pending row is still in the sheet — try again or add manually.</p>`
    );
  }

  const link = result.calendarUrl
    ? `<p><a href="${result.calendarUrl}">Open the event in Google Calendar →</a></p>`
    : "";
  return htmlResponse(
    200,
    "Booked",
    `<h1 class="ok">Added to TSGC Schedule ✅</h1><p class="muted">The CRM row is marked Booked and the calendar event was created.</p>${link}`
  );
}
