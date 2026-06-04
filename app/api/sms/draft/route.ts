/**
 * Regenerate the AI suggested draft for a conversation — the "Regenerate"
 * button in the /admin inbox composer. Self-gated to admins.
 */

import { revalidateTag } from "next/cache";
import { auth, isAdmin } from "@/auth";
import { generateDraftForConversation } from "@/lib/comms/generate";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { conversationId } = (await req.json().catch(() => ({}))) as { conversationId?: string };
  if (!conversationId) {
    return Response.json({ error: "conversationId required" }, { status: 400 });
  }

  const draft = await generateDraftForConversation(conversationId);
  if (!draft) {
    return Response.json(
      { error: "draft unavailable (check ANTHROPIC_API_KEY / Supabase)" },
      { status: 503 }
    );
  }
  revalidateTag("admin-inbox");
  return Response.json({ ok: true, draft });
}
