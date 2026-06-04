/**
 * Marketing batch agent (weekly). For each job finished in the last 7 days,
 * drafts a social post (in Jeff's voice via generateSocialPost) and stores it
 * in marketing_drafts for review on /admin/marketing. Idempotent: one draft per
 * job. Drafts only — Jeff copies + posts.
 */

import { authorizeCron, runAgent } from "@/lib/agents/runner";
import { getSupabase } from "@/lib/db/supabase";
import { generateSocialPost } from "@/lib/marketing/generate";

export const runtime = "nodejs";
export const maxDuration = 120;

type JobRow = {
  id: string; grill_brand: string | null; grill_model: string | null;
  grill_type: string | null; service: string | null; date_completed: string | null;
  contact: { zip: string | null } | null;
};

export async function GET(req: Request) {
  if (!authorizeCron(req)) return new Response("unauthorized", { status: 401 });

  return runAgent("marketing", async () => {
    const sb = getSupabase();
    const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);

    const { data: jobs } = await sb
      .from("jobs")
      .select("id, grill_brand, grill_model, grill_type, service, date_completed, contact:contacts(zip)")
      .in("status", ["completed", "paid"])
      .gte("date_completed", weekAgo)
      .limit(8);

    let produced = 0;
    for (const j of (jobs ?? []) as unknown as JobRow[]) {
      const { data: existing } = await sb
        .from("marketing_drafts")
        .select("id")
        .eq("job_id", j.id)
        .limit(1)
        .maybeSingle();
      if (existing) continue;

      const summary = [
        j.grill_brand && j.grill_model ? `${j.grill_brand} ${j.grill_model}` : j.grill_model || j.grill_brand,
        j.grill_type,
        j.service,
        j.contact?.zip ? `ZIP ${j.contact.zip}` : null,
        j.date_completed ? `cleaned ${j.date_completed}` : null,
      ].filter(Boolean).join(" · ");

      const body = await generateSocialPost(summary || "Finished grill cleaning job");
      if (!body) continue;
      await sb.from("marketing_drafts").insert({ job_id: j.id, kind: "social", body, status: "new" });
      produced++;
    }
    return { produced };
  });
}
