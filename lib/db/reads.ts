/**
 * Supabase read layer for /admin. Returns the SAME Lead/Job shapes that
 * lib/admin/sheets.ts exported, so swapping the admin pages' imports from
 * "@/lib/admin/sheets" to "@/lib/db/reads" is a drop-in (the read-layer flip).
 *
 * Cached with unstable_cache + the same tags the Sheets layer used
 * (admin-leads / admin-jobs), plus admin-inbox for the comms surface, so
 * revalidateTag() continues to work unchanged.
 */

import { unstable_cache } from "next/cache";
import { getSupabase, isSupabaseConfigured } from "./supabase";
import type {
  Lead, Job, JobRow, ContactRow, ConversationRow, MessageRow,
  ConversationSummary, ConversationThread,
} from "./types";

type JobWithContact = JobRow & { contact: ContactRow | null };

function toLead(j: JobWithContact, i: number): Lead {
  const c = j.contact;
  return {
    rowNumber: i + 2,
    timestamp: j.created_at ?? "",
    status: j.status ?? "",
    name: c?.name ?? "",
    phone: c?.phone_e164 ?? "",
    email: c?.email ?? "",
    zip: c?.zip ?? "",
    services: j.service ?? "",
    grillModel: j.grill_model ?? c?.grill_model ?? "",
    source: j.source ?? c?.source ?? "",
    referredBy: j.referred_by ?? c?.referred_by ?? "",
    bestTime: "",
    promoCode: "",
    notes: j.notes ?? "",
    leadId: j.legacy_lead_id ?? j.id,
  };
}

function toJob(j: JobWithContact, i: number): Job {
  const c = j.contact;
  return {
    rowNumber: i + 2,
    leadId: j.legacy_lead_id ?? j.id,
    date: j.date_completed ?? j.date_booked ?? j.created_at ?? "",
    name: c?.name ?? "",
    phone: c?.phone_e164 ?? "",
    email: c?.email ?? "",
    zip: c?.zip ?? "",
    service: j.service ?? "",
    grillModel: j.grill_model ?? c?.grill_model ?? "",
    source: j.source ?? c?.source ?? "",
    referredBy: j.referred_by ?? c?.referred_by ?? "",
    notes: j.notes ?? "",
    status: j.status ?? "",
  };
}

async function fetchJobsWithContacts(): Promise<JobWithContact[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await getSupabase()
    .from("jobs")
    .select("*, contact:contacts(*)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as JobWithContact[];
}

const readLeadsCached = unstable_cache(
  async (): Promise<Lead[]> => (await fetchJobsWithContacts()).map(toLead),
  ["db-admin-leads"],
  { revalidate: 60, tags: ["admin-leads"] }
);

const readJobsCached = unstable_cache(
  async (): Promise<Job[]> => (await fetchJobsWithContacts()).map(toJob),
  ["db-admin-jobs"],
  { revalidate: 60, tags: ["admin-jobs"] }
);

export async function readLeads(): Promise<Lead[]> {
  try {
    return await readLeadsCached();
  } catch {
    return [];
  }
}

export async function readJobs(): Promise<Job[]> {
  try {
    return await readJobsCached();
  } catch {
    return [];
  }
}

// ---- comms inbox reads -----------------------------------------------------

export async function readConversations(): Promise<ConversationSummary[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = getSupabase();
  const { data, error } = await sb
    .from("conversations")
    .select("*, contact:contacts(id,name,phone_e164,service_address)")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(200);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as (ConversationRow & {
    contact: ConversationSummary["contact"];
  })[];
  // Pull the latest message body per conversation for the list preview.
  const ids = rows.map((r) => r.id);
  const lastByConv = new Map<string, string | null>();
  if (ids.length) {
    const { data: msgs } = await sb
      .from("messages")
      .select("conversation_id, body, created_at")
      .in("conversation_id", ids)
      .order("created_at", { ascending: false });
    for (const m of (msgs ?? []) as Pick<MessageRow, "conversation_id" | "body">[]) {
      if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, m.body ?? null);
    }
  }
  return rows.map((r) => ({ ...r, lastMessageBody: lastByConv.get(r.id) ?? null }));
}

export async function readConversation(id: string): Promise<ConversationThread | null> {
  if (!isSupabaseConfigured()) return null;
  const sb = getSupabase();
  const { data: conv, error } = await sb
    .from("conversations")
    .select("*, contact:contacts(*), job:jobs(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!conv) return null;

  const { data: messages } = await sb
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  const { data: draft } = await sb
    .from("drafts")
    .select("*")
    .eq("conversation_id", id)
    .eq("status", "suggested")
    .maybeSingle();

  const row = conv as unknown as ConversationThread & {
    contact: ConversationThread["contact"];
    job: ConversationThread["job"];
  };
  return {
    ...row,
    messages: (messages ?? []) as MessageRow[],
    activeDraft: (draft as ConversationThread["activeDraft"]) ?? null,
  };
}
