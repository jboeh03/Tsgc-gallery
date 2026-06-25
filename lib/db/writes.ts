/**
 * Supabase write layer. Used by the SMS webhook, the send/draft routes, and
 * the appointments API. All writes go through the service-role client.
 *
 * These are intentionally small, single-purpose helpers so the route handlers
 * read top-to-bottom. Idempotency for inbound SMS is anchored on messages.twilio_sid.
 */

import { getSupabase, isSupabaseConfigured } from "./supabase";
import type {
  ContactRow, ConversationRow, MessageRow, DraftRow, AppointmentRow, JobRow,
  MessageDirection, MessageChannel, EventKind, PipelineStatus,
  ConciergeChatRow, ConciergeTurn,
} from "./types";

/** Upsert a contact by phone (the SMS dedup key). Inbound text implies consent. */
export async function upsertContactByPhone(
  phoneE164: string,
  fields: Partial<ContactRow> = {},
  opts: { markConsent?: boolean } = {}
): Promise<ContactRow> {
  const sb = getSupabase();
  const { data: existing } = await sb
    .from("contacts")
    .select("*")
    .eq("phone_e164", phoneE164)
    .maybeSingle();

  if (existing) {
    const patch: Partial<ContactRow> = { ...fields };
    if (opts.markConsent && !existing.sms_consent) {
      patch.sms_consent = true;
      patch.sms_consent_at = new Date().toISOString();
    }
    if (Object.keys(patch).length === 0) return existing as ContactRow;
    const { data, error } = await sb
      .from("contacts")
      .update(patch)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as ContactRow;
  }

  const insert: Partial<ContactRow> = {
    phone_e164: phoneE164,
    source: fields.source ?? "sms-inbound",
    ...fields,
  };
  if (opts.markConsent) {
    insert.sms_consent = true;
    insert.sms_consent_at = new Date().toISOString();
  }
  const { data, error } = await sb.from("contacts").insert(insert).select().single();
  if (error) throw new Error(error.message);
  return data as ContactRow;
}

/** Get or create the single conversation thread for a (contact, twilio number). */
export async function getOrCreateConversation(
  contactId: string,
  twilioNumber: string
): Promise<ConversationRow> {
  const sb = getSupabase();
  const { data: existing } = await sb
    .from("conversations")
    .select("*")
    .eq("contact_id", contactId)
    .eq("twilio_number", twilioNumber)
    .maybeSingle();
  if (existing) return existing as ConversationRow;

  const { data, error } = await sb
    .from("conversations")
    .insert({ contact_id: contactId, twilio_number: twilioNumber, status: "open" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ConversationRow;
}

/**
 * Append a message. Idempotent on twilio_sid — if Twilio retries the webhook,
 * the duplicate is ignored and this returns null.
 */
export async function appendMessage(input: {
  conversationId: string;
  direction: MessageDirection;
  channel?: MessageChannel;
  body?: string | null;
  mediaUrls?: string[];
  fromE164?: string | null;
  toE164?: string | null;
  twilioSid?: string | null;
  status?: string | null;
  aiGenerated?: boolean;
}): Promise<MessageRow | null> {
  const sb = getSupabase();
  const row: Partial<MessageRow> = {
    conversation_id: input.conversationId,
    direction: input.direction,
    channel: input.channel ?? "sms",
    body: input.body ?? null,
    media_urls: input.mediaUrls ?? [],
    from_e164: input.fromE164 ?? null,
    to_e164: input.toE164 ?? null,
    twilio_sid: input.twilioSid ?? null,
    status: input.status ?? null,
    ai_generated: input.aiGenerated ?? false,
  };
  const { data, error } = await sb
    .from("messages")
    .upsert(row, { onConflict: "twilio_sid", ignoreDuplicates: true })
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as MessageRow) ?? null; // null = already seen (idempotent skip)
}

/** Update conversation cursor after a message. */
export async function touchConversation(
  conversationId: string,
  patch: { lastDirection: MessageDirection; unread?: boolean }
): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb
    .from("conversations")
    .update({
      last_message_at: new Date().toISOString(),
      last_direction: patch.lastDirection,
      ...(patch.unread != null ? { unread: patch.unread } : {}),
    })
    .eq("id", conversationId);
  if (error) throw new Error(error.message);
}

/** Replace the active suggested draft for a conversation. */
export async function setSuggestedDraft(input: {
  conversationId: string;
  body: string;
  missingFields: string[];
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
}): Promise<DraftRow> {
  const sb = getSupabase();
  // Clear any prior suggested draft (the partial unique index allows only one).
  await sb
    .from("drafts")
    .update({ status: "dismissed" })
    .eq("conversation_id", input.conversationId)
    .eq("status", "suggested");

  const { data, error } = await sb
    .from("drafts")
    .insert({
      conversation_id: input.conversationId,
      body: input.body,
      status: "suggested",
      missing_fields: input.missingFields,
      model: input.model ?? null,
      prompt_tokens: input.promptTokens ?? null,
      completion_tokens: input.completionTokens ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as DraftRow;
}

/** Mark the active draft sent (called after a successful outbound send). */
export async function markDraftSent(conversationId: string): Promise<void> {
  const sb = getSupabase();
  await sb
    .from("drafts")
    .update({ status: "sent" })
    .eq("conversation_id", conversationId)
    .eq("status", "suggested");
}

export async function createAppointment(
  input: Partial<AppointmentRow>
): Promise<AppointmentRow> {
  const sb = getSupabase();
  const { data, error } = await sb.from("appointments").insert(input).select().single();
  if (error) throw new Error(error.message);
  return data as AppointmentRow;
}

export async function updateAppointment(id: string, patch: Partial<AppointmentRow>): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.from("appointments").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setJobStatus(jobId: string, status: PipelineStatus): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.from("jobs").update({ status }).eq("id", jobId);
  if (error) throw new Error(error.message);
}

/** General job patch (status, quote, paid, review flags, …) from the admin CRM. */
export async function updateJob(jobId: string, patch: Partial<JobRow>): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.from("jobs").update(patch).eq("id", jobId);
  if (error) throw new Error(error.message);
}

/** General contact patch (name, phone, email, address, grill, …) from the admin CRM. */
export async function updateContact(contactId: string, patch: Partial<ContactRow>): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.from("contacts").update(patch).eq("id", contactId);
  if (error) throw new Error(error.message);
}

/**
 * Persist a public concierge chat, keyed by the client-generated session_id.
 * The widget re-sends the full running transcript each turn, so this upserts
 * the whole conversation — always complete, no per-turn stitching.
 *
 * `insertOnly` (the widget's open-ping) creates the row once but never clobbers
 * a richer transcript a real message may have already written. Best-effort: a
 * no-op when Supabase is unconfigured, and it swallows its own errors so chat
 * logging never blocks the reply reaching the customer.
 */
export async function saveConciergeChat(input: {
  sessionId: string;
  transcript: ConciergeTurn[];
  ip?: string | null;
  converted?: boolean;
  contactId?: string | null;
  insertOnly?: boolean;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const row: Partial<ConciergeChatRow> = {
      session_id: input.sessionId,
      transcript: input.transcript,
      message_count: input.transcript.filter((m) => m.role === "user").length,
      ip: input.ip ?? null,
      updated_at: new Date().toISOString(),
    };
    // Only set these when truthy so a later plain turn never un-converts a row.
    if (input.converted) row.converted = true;
    if (input.contactId) row.contact_id = input.contactId;
    await getSupabase()
      .from("concierge_chats")
      .upsert(row, { onConflict: "session_id", ignoreDuplicates: input.insertOnly ?? false });
  } catch {
    /* best-effort chat logging */
  }
}

/** Fire-and-forget-ish audit log; never throws into the caller's happy path. */
export async function logEvent(
  kind: EventKind,
  refs: { contactId?: string | null; jobId?: string | null; conversationId?: string | null } = {},
  meta: Record<string, unknown> = {}
): Promise<void> {
  try {
    await getSupabase().from("events").insert({
      kind,
      contact_id: refs.contactId ?? null,
      job_id: refs.jobId ?? null,
      conversation_id: refs.conversationId ?? null,
      meta,
    });
  } catch {
    /* audit logging is best-effort */
  }
}
