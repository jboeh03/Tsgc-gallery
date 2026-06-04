/**
 * Follow-up & collections agent (daily). Drafts a gentle nudge into the inbox
 * for quoted leads that went cold (5+ days, no booking) and for open invoices.
 * Output is a draft Jeff reviews + sends — nothing auto-sends.
 */

import { authorizeCron, runAgent } from "@/lib/agents/runner";
import { ensureNudgeDraft } from "@/lib/agents/drafts";
import { getSupabase } from "@/lib/db/supabase";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";
export const maxDuration = 120;

type JobRow = { id: string; contact_id: string | null; date_quoted: string | null; contact: { name: string | null; sms_opt_out: boolean } | null };

const first = (name: string | null | undefined) => (name || "").trim().split(/\s+/)[0] || "there";

export async function GET(req: Request) {
  if (!authorizeCron(req)) return new Response("unauthorized", { status: 401 });

  return runAgent("followup", async () => {
    const sb = getSupabase();
    const coldCutoff = new Date(Date.now() - 5 * 86_400_000).toISOString().slice(0, 10);
    let produced = 0;

    const { data: quoted } = await sb
      .from("jobs")
      .select("id, contact_id, date_quoted, contact:contacts(name, sms_opt_out)")
      .eq("status", "quoted")
      .lte("date_quoted", coldCutoff);

    for (const j of (quoted ?? []) as unknown as JobRow[]) {
      if (!j.contact_id || j.contact?.sms_opt_out) continue;
      const body = `Hey ${first(j.contact?.name)}, just following up on the quote we sent over for your grill cleaning — still happy to get you on the schedule. Want me to find a time that works? — Jeff, ${SITE.shortName}`;
      if (await ensureNudgeDraft({ contactId: j.contact_id, body, withinDays: 5 })) produced++;
    }

    const { data: invoiced } = await sb
      .from("jobs")
      .select("id, contact_id, date_quoted, contact:contacts(name, sms_opt_out)")
      .eq("status", "invoiced");

    let collections = 0;
    for (const j of (invoiced ?? []) as unknown as JobRow[]) {
      if (!j.contact_id || j.contact?.sms_opt_out) continue;
      const body = `Hi ${first(j.contact?.name)}, friendly reminder that your invoice from ${SITE.name} is still open. Reply here if you'd like me to resend the secure pay link — thanks!`;
      if (await ensureNudgeDraft({ contactId: j.contact_id, body, withinDays: 3 })) collections++;
    }

    return { produced: produced + collections, detail: { quoted_nudges: produced, invoice_reminders: collections } };
  });
}
