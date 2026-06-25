/**
 * Public concierge chat. Stateless: the client sends the running transcript
 * (user/assistant text only); the server runs the full Anthropic tool-loop for
 * this turn (estimate_quote / capture_lead) and returns the assistant's reply.
 * Tool calls don't leak into the client transcript, so the history stays clean.
 *
 * Mirrors the COO tool-loop (lib/agents/coo.ts) and reuses ingestLead so chats
 * become CRM leads exactly like the forms. Degrades to a 503 without an API key.
 */
import Anthropic from "@anthropic-ai/sdk";
import { buildConciergePrompt } from "@/lib/concierge/prompt";
import { CONCIERGE_TOOLS, runConciergeTool } from "@/lib/concierge/tools";
import { saveConciergeChat } from "@/lib/db/writes";
import { clientIp, publicFormAllowed } from "@/lib/ratelimit";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";
export const maxDuration = 60;

type ClientMsg = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: `Chat is offline right now — call or text us at ${SITE.phone}.` },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    messages?: ClientMsg[];
    sessionId?: string;
  };
  const sessionId = typeof body.sessionId === "string" && body.sessionId ? body.sessionId : null;
  const incoming = Array.isArray(body.messages) ? body.messages : [];
  const msgs = incoming
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") {
    return Response.json({ error: "No message." }, { status: 400 });
  }

  const allowed = await publicFormAllowed("concierge", clientIp(req));
  if (!allowed) {
    return Response.json(
      { error: "You've sent a lot of messages — give it a minute, or just call/text us." },
      { status: 429 },
    );
  }

  const client = new Anthropic();
  const messages: Anthropic.MessageParam[] = msgs.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let reply = "";
  let capturedContactId: string | null = null;
  try {
    for (let i = 0; i < 4; i++) {
      const r = await client.messages.create({
        model: process.env.CONCIERGE_MODEL || "claude-haiku-4-5",
        max_tokens: 1024,
        system: [
          { type: "text", text: buildConciergePrompt(), cache_control: { type: "ephemeral" } },
        ],
        tools: CONCIERGE_TOOLS,
        messages,
      });

      if (r.stop_reason === "tool_use") {
        messages.push({ role: "assistant", content: r.content });
        const results: Anthropic.ToolResultBlockParam[] = [];
        for (const block of r.content) {
          if (block.type === "tool_use") {
            const out = await runConciergeTool(
              block.name,
              block.input as Record<string, unknown>,
            );
            if (block.name === "capture_lead") {
              try {
                const parsed = JSON.parse(out) as { ok?: boolean; contactId?: string };
                if (parsed.ok && parsed.contactId) capturedContactId = parsed.contactId;
              } catch { /* non-JSON tool output — ignore */ }
            }
            results.push({ type: "tool_result", tool_use_id: block.id, content: out });
          }
        }
        messages.push({ role: "user", content: results });
        continue;
      }

      reply = r.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      break;
    }
  } catch {
    return Response.json(
      { error: `Sorry — something hiccupped. You can always reach us at ${SITE.phone}.` },
      { status: 502 },
    );
  }

  if (!reply) reply = "Sorry, I didn't catch that — mind rephrasing?";

  // Persist the chat (best-effort) so /admin/concierge can see it. The widget
  // re-sends the full running transcript, so msgs + this reply IS the whole
  // conversation as the customer saw it.
  if (sessionId) {
    await saveConciergeChat({
      sessionId,
      transcript: [...msgs, { role: "assistant", content: reply }],
      ip: clientIp(req),
      converted: Boolean(capturedContactId),
      contactId: capturedContactId,
    });
  }

  return Response.json({ reply });
}
