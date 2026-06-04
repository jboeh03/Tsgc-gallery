import { auth, isAdmin } from "@/auth";
import { getSupabase } from "@/lib/db/supabase";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id, action } = (await req.json().catch(() => ({}))) as { id?: string; action?: string };
  if (!id || (action !== "done" && action !== "dismiss")) {
    return Response.json({ error: "id + action (done|dismiss) required" }, { status: 400 });
  }
  const { error } = await getSupabase().from("backlog").update({ status: action }).eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
