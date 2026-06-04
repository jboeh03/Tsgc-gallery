/**
 * Proactive first-touch follow-up for a new website lead. Drafts a friendly
 * opening text (from Jeff) that thanks them and asks for whatever quote info is
 * still missing. The draft lands in /admin/inbox for Jeff to review + send — a
 * human always presses send, so it never feels like a bot, and the natural
 * delay (until Jeff gets to it) is a feature.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { ContactRow } from "@/lib/db/types";
import { type MissingField, FIELD_LABELS } from "./missingFields";

export async function draftFollowupOpener(
  contact: Pick<ContactRow, "name" | "grill_model" | "service_address">,
  missingFields: MissingField[]
): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const client = new Anthropic();
    const firstName = (contact.name || "").trim().split(/\s+/)[0] || "";
    const missing = missingFields.length
      ? missingFields.map((f) => `- ${FIELD_LABELS[f]}`).join("\n")
      : "(nothing missing — just confirm you'll send a quote shortly)";

    const system = `You are Jeff, owner of Tri-State Grill Cleaning (veteran-founded, at-home grill cleaning in Cincinnati / NKY / Dayton). A new lead just submitted your website quote form. Write the FIRST text you'd send them.

Rules: warm, brief (1-3 sentences), first person, no corporate fluff, no emoji spray, no ALL CAPS. Thank them, then ask ONLY for the missing info needed to quote. If nothing is missing, just say you'll text a quote shortly. End naturally. Do not include a price.`;

    const user = `Lead first name: ${firstName || "(unknown)"}\nMissing info to ask for:\n${missing}\n\nWrite the opening text.`;

    const r = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 400,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: user }],
    });
    const t = r.content.find((b) => b.type === "text");
    return t && t.type === "text" ? t.text.trim() : null;
  } catch {
    return null;
  }
}
