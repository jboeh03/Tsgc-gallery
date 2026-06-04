/**
 * Dual-write lead ingest endpoint. The public quote form fires a best-effort
 * POST here (in parallel with its existing Apps Script POST) so new leads also
 * land in Supabase. Open by design — same trust model as the existing public
 * form endpoint — and fail-soft so it can never block the lead.
 */

import { ingestLead, type LeadInput } from "@/lib/db/ingest";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: LeadInput;
  try {
    body = (await req.json()) as LeadInput;
  } catch {
    // The form sends JSON; tolerate text/plain bodies too.
    try {
      body = JSON.parse(await req.text()) as LeadInput;
    } catch {
      return Response.json({ ok: false, error: "invalid body" }, { status: 400 });
    }
  }

  // Need at least a phone or email to be a usable lead.
  if (!body.phone && !body.email) {
    return Response.json({ ok: false, error: "phone or email required" }, { status: 400 });
  }

  const result = await ingestLead(body);
  return Response.json({ ok: Boolean(result), ...(result ?? {}) });
}
