import { auth, isAdmin } from "@/auth";
import { getSupabase } from "@/lib/db/supabase";
import type { BacklogRow } from "@/lib/db/types";

export const runtime = "nodejs";

const ALLOWED = ["done", "dismiss", "approve", "run"] as const;
type Action = (typeof ALLOWED)[number];

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id, action } = (await req.json().catch(() => ({}))) as { id?: string; action?: Action };
  if (!id || !action || !ALLOWED.includes(action)) {
    return Response.json({ error: "id + action (done|dismiss|approve|run) required" }, { status: 400 });
  }
  const sb = getSupabase();

  // Approve = greenlight the idea into a proposed task; Run = push it straight
  // to in-progress. Both turn the backlog item into a tracked coo_task routed to
  // Claude (the dev) to scope with the COO, then move it out of the open backlog.
  if (action === "approve" || action === "run") {
    const { data: row } = await sb.from("backlog").select("*").eq("id", id).maybeSingle();
    const b = row as BacklogRow | null;
    if (!b) return Response.json({ error: "not found" }, { status: 404 });

    const { error: taskErr } = await sb.from("coo_tasks").insert({
      title: b.title,
      detail: [b.detail, `From backlog · ${b.category ?? "improvement"}`].filter(Boolean).join("\n"),
      assignee: "Claude",
      status: action === "run" ? "in_progress" : "proposed",
      priority: b.priority ?? "medium",
      meta: { source: "backlog", backlog_id: b.id },
    });
    if (taskErr) return Response.json({ error: taskErr.message }, { status: 500 });

    const { error } = await sb.from("backlog").update({ status: action === "run" ? "done" : "approved" }).eq("id", id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  }

  const { error } = await sb.from("backlog").update({ status: action }).eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
