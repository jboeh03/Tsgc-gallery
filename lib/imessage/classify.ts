/**
 * Claude-powered conversation classifier for the iMessage booking flow.
 *
 * Given the last N messages in a thread, decide:
 *   - what stage the booking is at (inquiry → quoting → confirmed)
 *   - if confirmed: extract date, time, agreed price, address, grill notes
 *
 * Uses claude-haiku-4-5 with structured JSON output (output_config). The
 * long system prompt is cached so repeat calls on the same thread stay
 * cheap. Vision-capable: image attachments from the thread are passed
 * inline so Claude can describe the grill and read any photo-only info.
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  ClassificationResult,
  IngestMessage,
  IngestRequest,
} from "./types";

const SYSTEM_PROMPT = `You are the booking triage assistant for Tri-State Grill Cleaning (TSGC), a veteran-founded grill cleaning service in Cincinnati, Northern Kentucky, and Dayton. The owner Jeff Boeh handles inquiries by iMessage — your job is to read the thread and decide what stage the conversation is at.

OUTPUT STAGES:
- "non_booking": personal/friend chat, sales outreach, wrong number, or otherwise not a real service inquiry. Pick this if there's no real chance this turns into a TSGC booking.
- "inquiry": customer reached out about service but no pricing has been quoted yet, OR they're asking a general question (do you service X area, what does it cost roughly).
- "quoting": Jeff has thrown out a price or price range; customer is still deciding or asking follow-ups; no date pinned.
- "needs_info": price is agreed (or implied), but Jeff still needs something to book — address, a photo of the grill, or a specific time within a discussed window. Use this when the conversation is on the cusp but not done.
- "confirmed": a specific date AND a specific time (or clear time window) AND a price are all agreed. The next step is putting it on the calendar.

BE CONSERVATIVE about "confirmed". DO NOT mark confirmed unless:
1. A clear date is on the table (today/tomorrow/specific weekday/MM-DD). "Maybe next week" is NOT confirmed.
2. A time or window is agreed ("9am", "morning", "between 1-3"). "Sometime that day" is NOT confirmed.
3. A price is agreed (an explicit number or "$349 works for me" / "sounds good" right after Jeff quoted).
4. The most recent customer message indicates agreement (yes/perfect/let's do it/see you then), not just a question.

If the customer is still asking questions or hasn't acknowledged Jeff's proposed time, it's "needs_info" or "quoting" — not "confirmed".

EXTRACTION RULES when stage is "confirmed" (set these fields; otherwise leave nulls):
- scheduledDate: ISO YYYY-MM-DD. If they say "tomorrow", compute from the latest message's date in the thread.
- scheduledStartTime: 24h HH:MM if a specific time is agreed. Use null for windows like "morning"/"afternoon".
- scheduledTimeLabel: the natural-language time as written ("9am", "between 1 and 3", "morning").
- agreedPriceUsd: integer dollars. If a range was quoted and customer agreed, use the lower number. If "the $349" was confirmed, use 349.
- address: full street address if shared. Just a city/neighborhood is NOT enough — leave null in that case (Jeff still needs the address).
- durationHours: estimate from grill size — 2 for portable/2-burner, 3 for 3-burner, 4 for 4-burner, 5 for built-in or 6+ burner. Default 3 if unsure.
- grillDescription: brief, e.g. "4-burner Weber Genesis II" or "Built-in Lynx 36"" — describe what you see in photos if no text description.
- customerName: from the thread context or signed messages.
- notes: anything Jeff should know on-site — gate code, parking, dog warning, specific concerns mentioned. Don't restate the price/date.
- photoCount: count of image attachments in the thread.

ADDRESS EDGE CASE: if a customer shared an address THEN scheduled, set it. If they shared a city only or said "I'll text my address closer", leave null and stage stays "needs_info" even if everything else is set.

SUMMARY: write ONE short sentence describing where things stand. Examples:
- "New inquiry — asking about a 4-burner Weber, no quote yet."
- "Quoted $349, customer thinking it over."
- "Confirmed for Sat 9am at the Anderson address, $399."

TONE: factual, no fluff. The summary lands in a push notification on Jeff's phone.`;

function formatMessage(m: IngestMessage): string {
  const who = m.fromMe ? "Jeff" : "Customer";
  const time = new Date(m.isoDate).toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const attachNote =
    m.attachments.length > 0
      ? ` [${m.attachments.length} attachment${m.attachments.length === 1 ? "" : "s"}]`
      : "";
  const body = (m.text || "").trim() || "(no text)";
  return `[${time}] ${who}: ${body}${attachNote}`;
}

export async function classifyThread(
  req: IngestRequest
): Promise<ClassificationResult> {
  const client = new Anthropic();

  const transcript = req.messages.map(formatMessage).join("\n");

  // Collect up to 3 most recent inline image attachments for Claude to see.
  const recentImages: { mime: string; base64: string }[] = [];
  for (let i = req.messages.length - 1; i >= 0 && recentImages.length < 3; i--) {
    for (const a of req.messages[i].attachments) {
      if (a.imageBase64 && a.mime.startsWith("image/") && recentImages.length < 3) {
        recentImages.push({ mime: a.mime, base64: a.imageBase64 });
      }
    }
  }

  const userContent: Anthropic.MessageCreateParams["messages"][number]["content"] = [
    {
      type: "text",
      text: `Customer: ${req.customerName ?? "(unknown name)"} — ${req.customerPhone ?? "(unknown number)"}\nChat GUID: ${req.chatGuid}\nPrior stage: ${req.priorStage ?? "(none)"}\n\nTranscript (oldest first):\n${transcript}\n\nClassify the current stage and extract booking details.`,
    },
  ];
  for (const img of recentImages) {
    userContent.push({
      type: "image",
      source: { type: "base64", media_type: img.mime as never, data: img.base64 },
    });
  }

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            stage: {
              type: "string",
              enum: ["non_booking", "inquiry", "quoting", "needs_info", "confirmed"],
            },
            confidence: { type: "string", enum: ["low", "medium", "high"] },
            summary: { type: "string" },
            booking: {
              type: "object",
              additionalProperties: false,
              properties: {
                customerName: { anyOf: [{ type: "string" }, { type: "null" }] },
                address: { anyOf: [{ type: "string" }, { type: "null" }] },
                agreedPriceUsd: { anyOf: [{ type: "integer" }, { type: "null" }] },
                scheduledDate: { anyOf: [{ type: "string" }, { type: "null" }] },
                scheduledStartTime: { anyOf: [{ type: "string" }, { type: "null" }] },
                scheduledTimeLabel: { anyOf: [{ type: "string" }, { type: "null" }] },
                durationHours: { type: "number" },
                grillDescription: { anyOf: [{ type: "string" }, { type: "null" }] },
                notes: { anyOf: [{ type: "string" }, { type: "null" }] },
                photoCount: { type: "integer" },
              },
              required: [
                "customerName",
                "address",
                "agreedPriceUsd",
                "scheduledDate",
                "scheduledStartTime",
                "scheduledTimeLabel",
                "durationHours",
                "grillDescription",
                "notes",
                "photoCount",
              ],
            },
          },
          required: ["stage", "confidence", "summary", "booking"],
        },
      },
    },
    messages: [{ role: "user", content: userContent }],
  });

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") {
    throw new Error("Claude returned no text block");
  }
  return JSON.parse(text.text) as ClassificationResult;
}
