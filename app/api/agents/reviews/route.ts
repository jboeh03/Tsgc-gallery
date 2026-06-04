/**
 * Reviews & reputation agent (daily). For jobs completed/paid with no review
 * requested yet, drafts a "leave us a review" text with the Google link into
 * the inbox, and marks the job review_requested so it doesn't re-surface.
 * Jeff reviews + sends.
 */

import { authorizeCron, runAgent } from "@/lib/agents/runner";
import { ensureNudgeDraft } from "@/lib/agents/drafts";
import { getSupabase } from "@/lib/db/supabase";
import { updateJob } from "@/lib/db/writes";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";
export const maxDuration = 120;

type JobRow = { id: string; contact_id: string | null; contact: { name: string | null; sms_opt_out: boolean } | null };
const first = (name: string | null | undefined) => (name || "").trim().split(/\s+/)[0] || "there";

export async function GET(req: Request) {
  if (!authorizeCron(req)) return new Response("unauthorized", { status: 401 });

  return runAgent("reviews", async () => {
    const sb = getSupabase();
    let produced = 0;

    const { data: jobs } = await sb
      .from("jobs")
      .select("id, contact_id, status, review_requested, contact:contacts(name, sms_opt_out)")
      .in("status", ["completed", "paid"])
      .eq("review_requested", false);

    for (const j of (jobs ?? []) as unknown as JobRow[]) {
      if (!j.contact_id || j.contact?.sms_opt_out) continue;
      const body = `Hey ${first(j.contact?.name)}, thanks again for letting ${SITE.name} clean your grill! If you were happy with it, a quick Google review would mean a lot to us: ${SITE.social.googleReview}`;
      const made = await ensureNudgeDraft({ contactId: j.contact_id, body, withinDays: 14 });
      if (made) {
        await updateJob(j.id, { review_requested: true });
        produced++;
      }
    }

    return { produced, detail: { review_drafts: produced } };
  });
}
