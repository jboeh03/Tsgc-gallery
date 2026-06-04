import { revalidateTag } from "next/cache";
import { auth, isAdmin } from "@/auth";
import { runCoo } from "@/lib/agents/coo";
import { getSupabase } from "@/lib/db/supabase";
import type { CooTaskStatus } from "@/lib/db/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const TASK_ACTIONS: Record<string, CooTaskStatus> = {
  approve: "approved",
  start: "in_progress",
  done: "done",
  dismiss: "dismissed",
};

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { message?: string; taskId?: string; action?: string };

  // Task lifecycle action (approve / start / done / dismiss).
  if (body.taskId && body.action) {
    const status = TASK_ACTIONS[body.action];
    if (!status) return Response.json({ error: "bad action" }, { status: 400 });
    const { error } = await getSupabase()
      .from("coo_tasks")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", body.taskId);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    revalidateTag("admin-coo");
    return Response.json({ ok: true });
  }

  // A request to the COO.
  const message = (body.message ?? "").trim();
  if (!message) return Response.json({ error: "message required" }, { status: 400 });
  const result = await runCoo(message);
  revalidateTag("admin-coo");
  return Response.json(result);
}
