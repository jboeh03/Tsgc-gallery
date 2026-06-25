/**
 * Records that someone OPENED the concierge widget, even if they never type.
 * The widget pings this once on first open with its session id + the greeting;
 * saveConciergeChat(insertOnly) creates the row but never clobbers a richer
 * transcript a real message may have already written. Best-effort + fire-and-
 * forget on the client, so it always 200s and never blocks the chat UI.
 */
import { saveConciergeChat } from "@/lib/db/writes";
import { clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";

type ClientMsg = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    sessionId?: string;
    messages?: ClientMsg[];
  };
  const sessionId = typeof body.sessionId === "string" && body.sessionId ? body.sessionId : null;
  if (!sessionId) return Response.json({ ok: false }, { status: 400 });

  const transcript = (Array.isArray(body.messages) ? body.messages : [])
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  await saveConciergeChat({ sessionId, transcript, ip: clientIp(req), insertOnly: true });
  return Response.json({ ok: true });
}
