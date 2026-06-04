/**
 * Morning digest (daily). Ties the agent team together: one summary text to
 * Jeff of what's waiting in the HQ — drafts to review, CRM suggestions. Texts
 * Jeff only (the conductor), never a customer.
 */

import { authorizeCron, runAgent } from "@/lib/agents/runner";
import { getSupabase } from "@/lib/db/supabase";
import { getSuggestions } from "@/lib/admin/suggestions";
import { sendSms, isTwilioConfigured } from "@/lib/sms/twilio";

export const runtime = "nodejs";
export const maxDuration = 120;

const NOTIFY_TO = process.env.BOOKING_NOTIFY_TO || "+16578314276";

export async function GET(req: Request) {
  if (!authorizeCron(req)) return new Response("unauthorized", { status: 401 });
  return runAgent("digest", async () => {
    const sb = getSupabase();
    const { count: unread } = await sb
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("unread", true);
    const suggestions = await getSuggestions();

    const parts: string[] = [];
    if (unread) parts.push(`${unread} text thread${unread === 1 ? "" : "s"} to review`);
    if (suggestions.length) parts.push(`${suggestions.length} CRM suggestion${suggestions.length === 1 ? "" : "s"}`);

    if (parts.length && isTwilioConfigured()) {
      await sendSms({
        to: NOTIFY_TO,
        body: `Morning! Your HQ has ${parts.join(" + ")} ready. Open /admin to review & send.`,
      });
    }
    return { produced: 0, detail: { unread: unread ?? 0, suggestions: suggestions.length, texted: parts.length > 0 } };
  });
}
