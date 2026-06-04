/**
 * Helper for agents that drop a suggested text into a contact's inbox thread.
 * Idempotent + polite: skips if that thread already had a draft OR a message in
 * the last `withinDays`, so agents never re-nag a contact day after day. The
 * draft is a SUGGESTION — Jeff still presses send.
 */

import { getSupabase } from "@/lib/db/supabase";
import { getOrCreateConversation, setSuggestedDraft } from "@/lib/db/writes";

const TWILIO_NUMBER = process.env.TWILIO_PHONE_NUMBER || "+15137904040";

export async function ensureNudgeDraft(opts: {
  contactId: string;
  body: string;
  withinDays?: number;
}): Promise<boolean> {
  const sb = getSupabase();
  const conv = await getOrCreateConversation(opts.contactId, TWILIO_NUMBER);
  const since = new Date(Date.now() - (opts.withinDays ?? 5) * 86_400_000).toISOString();

  // Don't nudge a thread that's already active or recently nudged.
  if (conv.last_message_at && conv.last_message_at >= since) return false;
  const { data: recentDraft } = await sb
    .from("drafts")
    .select("id")
    .eq("conversation_id", conv.id)
    .gte("created_at", since)
    .limit(1)
    .maybeSingle();
  if (recentDraft) return false;

  await setSuggestedDraft({ conversationId: conv.id, body: opts.body, missingFields: [] });
  await sb
    .from("conversations")
    .update({ unread: true, last_message_at: new Date().toISOString() })
    .eq("id", conv.id);
  return true;
}
