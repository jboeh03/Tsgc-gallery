/**
 * Generate + persist an AI suggested draft for a conversation. Shared by the
 * inbound SMS webhook (auto-draft on new message) and the /api/sms/draft
 * regenerate route. Best-effort: returns null (never throws) when the AI is
 * unavailable, so a draft failure can't break the webhook's 200 response.
 */

import { readConversation } from "@/lib/db/reads";
import { setSuggestedDraft } from "@/lib/db/writes";
import { draftReply } from "./draft";
import { computeMissingFields } from "./missingFields";
import type { DraftRow } from "@/lib/db/types";

export async function generateDraftForConversation(conversationId: string): Promise<DraftRow | null> {
  try {
    const thread = await readConversation(conversationId);
    if (!thread || !thread.contact) return null;

    const hasPhoto = thread.messages.some(
      (m) => m.direction === "inbound" && m.media_urls?.length > 0
    );
    const missingFields = computeMissingFields(thread.contact, { hasPhoto });

    const result = await draftReply({
      messages: thread.messages,
      contact: thread.contact,
      missingFields,
      hasPhoto,
    });

    return await setSuggestedDraft({
      conversationId,
      body: result.reply,
      missingFields: result.asksFor,
      model: "claude-haiku-4-5",
      promptTokens: result.usage?.input,
      completionTokens: result.usage?.output,
    });
  } catch {
    return null;
  }
}
