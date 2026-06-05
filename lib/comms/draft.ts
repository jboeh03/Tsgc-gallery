/**
 * AI reply drafter for the SMS comms hub. Mirrors lib/preview/claude.ts:
 * Anthropic SDK, claude-haiku-4-5, cached system prompt, structured output.
 *
 * The draft is a SUGGESTION shown in /admin for one-click send — it is never
 * auto-sent by default. The model's job is to reply in Jeff's voice and ask
 * for exactly the missing quote-required fields (computed by missingFields.ts),
 * never re-asking for info already on file or supplied via a photo.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { ContactRow, MessageRow } from "@/lib/db/types";
import { type MissingField, FIELD_LABELS } from "./missingFields";

export type DraftResult = {
  reply: string;
  asksFor: MissingField[];
  readyToQuote: boolean;
};

const SYSTEM_PROMPT = `You are drafting SMS replies for Jeff, the owner of Tri-State Grill Cleaning — a veteran-founded grill deep-cleaning service in Cincinnati, Northern Kentucky, and Dayton.

You write the way the Tri-State crew texts: first person PLURAL ("we"/"us" — never "I"/"me"), warm, direct, no corporate fluff, no emoji spray, no ALL CAPS. A real local operator texting a neighbor back. Keep it to 1-3 short sentences — this is a text message, not an email.

YOUR JOB: continue the conversation and, when needed, collect the three things Jeff must have before he can quote a job:
  1. The full service address (where the grill is).
  2. The grill make/model (e.g. "Weber Genesis II").
  3. The grill size — number of burners, OR a photo of the grill.

You will be told which of these are still MISSING for this customer. Ask only for the missing ones, naturally, in one message. Never re-ask for something already on file. Never ask for a photo if they already sent one. If only one thing is missing, just ask for that one thing.

If NOTHING is missing (you have address, model, and size/photo), do not ask for more — acknowledge you have what you need and tell them Jeff will text a quote shortly. Set readyToQuote true in that case.

PRICING: never quote a specific price in the draft — pricing is Jeff's call once he sees the details/photo. You can say "I'll get you a quote" but never a dollar figure.

If the incoming message is off-topic, hostile, or clearly not about grill cleaning, write a brief polite reply and set asksFor to an empty list.

Always sound like a person, never like an automated system.`;

function transcript(messages: Pick<MessageRow, "direction" | "body" | "media_urls">[]): string {
  return messages
    .map((m) => {
      const who = m.direction === "inbound" ? "Customer" : "Jeff";
      const photo = m.media_urls?.length ? " [sent a photo]" : "";
      return `${who}: ${m.body ?? ""}${photo}`.trim();
    })
    .join("\n");
}

export async function draftReply(input: {
  messages: Pick<MessageRow, "direction" | "body" | "media_urls">[];
  contact: Pick<ContactRow, "name" | "service_address" | "grill_brand" | "grill_model" | "grill_burner_count">;
  missingFields: MissingField[];
  hasPhoto: boolean;
}): Promise<DraftResult & { usage?: { input: number; output: number } }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not set");
  }
  const client = new Anthropic();

  const known = [
    input.contact.name ? `Name: ${input.contact.name}` : null,
    input.contact.service_address ? `Address on file: ${input.contact.service_address}` : "Address: not yet provided",
    input.contact.grill_model || input.contact.grill_brand
      ? `Grill: ${[input.contact.grill_brand, input.contact.grill_model].filter(Boolean).join(" ")}`
      : "Grill make/model: not yet provided",
    input.contact.grill_burner_count
      ? `Burners: ${input.contact.grill_burner_count}`
      : input.hasPhoto
        ? "Grill size: a photo was provided"
        : "Grill size: not yet provided",
  ].filter(Boolean).join("\n");

  const missingLabels = input.missingFields.length
    ? input.missingFields.map((f) => `- ${FIELD_LABELS[f]}`).join("\n")
    : "(nothing missing — you have everything needed to quote)";

  const userText = `Conversation so far:\n${transcript(input.messages)}\n\nWhat we already know about this customer:\n${known}\n\nStill MISSING (ask only for these):\n${missingLabels}\n\nDraft Jeff's next reply.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            reply: { type: "string" },
            asksFor: {
              type: "array",
              items: { type: "string", enum: ["service_address", "grill_model", "grill_size"] },
            },
            readyToQuote: { type: "boolean" },
          },
          required: ["reply", "asksFor", "readyToQuote"],
        },
      },
    },
    messages: [{ role: "user", content: [{ type: "text", text: userText }] }],
  });

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("Claude returned no text block");
  const parsed = JSON.parse(text.text) as DraftResult;
  return {
    ...parsed,
    usage: { input: response.usage.input_tokens, output: response.usage.output_tokens },
  };
}
