/**
 * Smart CRM suggestions — watches the schedule + job lifecycle in Supabase and
 * proposes one-click updates Jeff can approve. Keeps the CRM current without
 * manual data entry.
 *
 * v1 rules:
 *  - a 'scheduled' job whose appointment date has passed  → mark Completed
 *  - a 'completed' job not yet flagged for a review        → request a review
 *  - a 'quoted' job with no movement for 5+ days           → follow up (informational)
 */

import { getSupabase, isSupabaseConfigured } from "@/lib/db/supabase";

export type SuggestionKind = "mark_completed" | "request_review" | "followup_quote";

export type Suggestion = {
  jobId: string;
  kind: SuggestionKind;
  title: string;
  detail: string;
  /** Whether the admin can apply it with one click (vs. just a nudge + link). */
  actionable: boolean;
  contactId: string | null;
};

const DAY = 86_400_000;
function daysSince(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const t = new Date(dateStr + (dateStr.length === 10 ? "T00:00:00" : "")).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / DAY);
}
const todayISO = () => new Date().toISOString().slice(0, 10);

export async function getSuggestions(): Promise<Suggestion[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = getSupabase();

  const [{ data: jobs }, { data: appts }] = await Promise.all([
    sb.from("jobs").select(
      "id, status, date_quoted, date_completed, date_booked, review_requested, contact_id, contact:contacts(name)"
    ),
    sb.from("appointments").select("job_id, scheduled_date").not("job_id", "is", null),
  ]);

  // latest appointment date per job
  const apptByJob = new Map<string, string>();
  for (const a of (appts ?? []) as { job_id: string; scheduled_date: string | null }[]) {
    if (!a.scheduled_date) continue;
    const prev = apptByJob.get(a.job_id);
    if (!prev || a.scheduled_date > prev) apptByJob.set(a.job_id, a.scheduled_date);
  }

  const today = todayISO();
  const out: Suggestion[] = [];

  for (const j of (jobs ?? []) as unknown as Array<{
    id: string; status: string; date_quoted: string | null; date_completed: string | null;
    date_booked: string | null; review_requested: boolean; contact_id: string | null;
    contact: { name: string | null } | null;
  }>) {
    const name = j.contact?.name || "this customer";

    if (j.status === "scheduled") {
      const when = apptByJob.get(j.id) || j.date_booked;
      if (when && when < today) {
        out.push({
          jobId: j.id, kind: "mark_completed", actionable: true, contactId: j.contact_id,
          title: `Mark ${name}'s job completed`,
          detail: `Scheduled for ${when}, which has passed.`,
        });
        continue;
      }
    }

    if ((j.status === "completed" || j.status === "paid") && !j.review_requested) {
      const d = daysSince(j.date_completed);
      out.push({
        jobId: j.id, kind: "request_review", actionable: true, contactId: j.contact_id,
        title: `Request a review from ${name}`,
        detail: d != null ? `Job completed ${d} day${d === 1 ? "" : "s"} ago.` : "Job completed — no review requested yet.",
      });
      continue;
    }

    if (j.status === "quoted") {
      const d = daysSince(j.date_quoted);
      if (d != null && d >= 5) {
        out.push({
          jobId: j.id, kind: "followup_quote", actionable: false, contactId: j.contact_id,
          title: `Follow up with ${name}`,
          detail: `Quoted ${d} days ago with no booking yet.`,
        });
      }
    }
  }

  // Most actionable first, then newest-feeling.
  return out.sort((a, b) => Number(b.actionable) - Number(a.actionable)).slice(0, 60);
}
