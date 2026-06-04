/**
 * Apply a CRM suggestion (admin-gated). One-click approval from the
 * Suggestions feed writes the change to Supabase. Works for both login methods
 * (auth() reads the shared admin session cookie).
 */

import { revalidateTag } from "next/cache";
import { auth, isAdmin } from "@/auth";
import { updateJob, logEvent } from "@/lib/db/writes";
import type { SuggestionKind } from "@/lib/admin/suggestions";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { jobId, kind } = (await req.json().catch(() => ({}))) as {
    jobId?: string;
    kind?: SuggestionKind;
  };
  if (!jobId || !kind) {
    return Response.json({ error: "jobId and kind required" }, { status: 400 });
  }

  try {
    if (kind === "mark_completed") {
      await updateJob(jobId, { status: "completed", date_completed: new Date().toISOString().slice(0, 10) });
    } else if (kind === "request_review") {
      await updateJob(jobId, { review_requested: true });
    } else {
      return Response.json({ error: "not a one-click action" }, { status: 400 });
    }
    await logEvent("status_change", { jobId }, { via: "suggestion", kind });
    revalidateTag("admin-jobs");
    revalidateTag("admin-leads");
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "failed" }, { status: 500 });
  }
}
