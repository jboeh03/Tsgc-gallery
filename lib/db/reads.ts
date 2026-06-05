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
  ConversationSummary, ConversationThread, MessageDirection, MessageChannel,
  CooTaskRow, CooMessageRow, GalleryJobRow,
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
    // Scoring columns (origin's lead-qualifier). Blank for Supabase rows; the
    // admin leads page recomputes a score on the fly when these are empty.
    score: "",
    tier: "",
    proximity: "",
    valueTier: "",
    customerType: "",
    completeness: "",
    intent: "",
    flags: "",
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

// ---- CRM (editable) reads --------------------------------------------------

export type CrmRow = {
  jobId: string;
  contactId: string | null;
  name: string;
  phone: string;
  email: string;
  zip: string;
  service: string;
  source: string;
  status: string;
  grillModel: string;
  quoteAmount: number | null;
  createdAt: string;
  // Most-recent interaction (SMS today; email once Gmail sync lands).
  lastActivityAt: string | null;
  lastActivity: string | null;
  lastDirection: MessageDirection | null;
  lastChannel: MessageChannel | null;
};

/**
 * For a set of contacts, the single most-recent message (any channel) per
 * contact — powers the CRM "Last activity" column. One conversations query +
 * one messages query, then reduced in memory.
 */
async function latestActivityByContact(
  contactIds: string[]
): Promise<Map<string, { at: string; body: string | null; direction: MessageDirection | null; channel: MessageChannel | null }>> {
  const out = new Map<string, { at: string; body: string | null; direction: MessageDirection | null; channel: MessageChannel | null }>();
  if (contactIds.length === 0) return out;
  const sb = getSupabase();
  const { data: convs } = await sb
    .from("conversations")
    .select("id, contact_id, last_message_at, last_direction")
    .in("contact_id", contactIds)
    .not("last_message_at", "is", null);
  const rows = (convs ?? []) as Pick<ConversationRow, "id" | "contact_id" | "last_message_at" | "last_direction">[];
  if (rows.length === 0) return out;

  // Latest conversation per contact.
  const convByContact = new Map<string, { id: string; at: string; direction: MessageDirection | null }>();
  for (const r of rows) {
    if (!r.last_message_at) continue;
    const cur = convByContact.get(r.contact_id);
    if (!cur || r.last_message_at > cur.at) {
      convByContact.set(r.contact_id, { id: r.id, at: r.last_message_at, direction: r.last_direction });
    }
  }

  // Latest message body per chosen conversation.
  const convIds = [...convByContact.values()].map((v) => v.id);
  const { data: msgs } = await sb
    .from("messages")
    .select("conversation_id, body, channel, created_at")
    .in("conversation_id", convIds)
    .order("created_at", { ascending: false });
  const bodyByConv = new Map<string, { body: string | null; channel: MessageChannel | null }>();
  for (const m of (msgs ?? []) as Pick<MessageRow, "conversation_id" | "body" | "channel">[]) {
    if (!bodyByConv.has(m.conversation_id)) bodyByConv.set(m.conversation_id, { body: m.body ?? null, channel: m.channel ?? null });
  }

  for (const [contactId, v] of convByContact) {
    const b = bodyByConv.get(v.id);
    out.set(contactId, { at: v.at, body: b?.body ?? null, direction: v.direction, channel: b?.channel ?? null });
  }
  return out;
}

/** Flat job+contact rows for the CRM list, carrying the real job UUID for editing. */
export async function readCrmRows(): Promise<CrmRow[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await getSupabase()
    .from("jobs")
    .select("id, status, service, source, grill_model, quote_amount, created_at, contact_id, contact:contacts(name, phone_e164, email, zip, grill_model)")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  const jobs = (data ?? []) as unknown as (JobRow & {
    contact: { name: string | null; phone_e164: string | null; email: string | null; zip: string | null; grill_model: string | null } | null;
  })[];

  const contactIds = [...new Set(jobs.map((j) => j.contact_id).filter((id): id is string => Boolean(id)))];
  const activity = await latestActivityByContact(contactIds);

  return jobs.map((row) => {
    const c = row.contact;
    const act = row.contact_id ? activity.get(row.contact_id) : undefined;
    return {
      jobId: row.id,
      contactId: row.contact_id,
      name: c?.name ?? "",
      phone: c?.phone_e164 ?? "",
      email: c?.email ?? "",
      zip: c?.zip ?? "",
      service: row.service ?? "",
      source: row.source ?? "",
      status: row.status ?? "",
      grillModel: row.grill_model ?? c?.grill_model ?? "",
      quoteAmount: row.quote_amount,
      createdAt: row.created_at ?? "",
      lastActivityAt: act?.at ?? null,
      lastActivity: act?.body ?? null,
      lastDirection: act?.direction ?? null,
      lastChannel: act?.channel ?? null,
    };
  });
}

/** The most-recent conversation + its messages for a contact, for the CRM detail thread. */
export async function readContactThread(
  contactId: string
): Promise<{ conversationId: string; messages: MessageRow[] } | null> {
  if (!isSupabaseConfigured()) return null;
  const sb = getSupabase();
  const { data: conv } = await sb
    .from("conversations")
    .select("id")
    .eq("contact_id", contactId)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  const conversationId = (conv as { id: string } | null)?.id;
  if (!conversationId) return null;

  const { data: messages } = await sb
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  return { conversationId, messages: (messages ?? []) as MessageRow[] };
}

/** Full job + contact for the editable detail view. */
export async function readJobDetail(jobId: string): Promise<{ job: JobRow; contact: ContactRow | null } | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await getSupabase()
    .from("jobs")
    .select("*, contact:contacts(*)")
    .eq("id", jobId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as unknown as JobRow & { contact: ContactRow | null };
  const { contact, ...job } = row;
  return { job: job as JobRow, contact: contact ?? null };
}

// ---- COO agent reads -------------------------------------------------------

const readCooTasksCached = unstable_cache(
  async (): Promise<CooTaskRow[]> => {
    if (!isSupabaseConfigured()) return [];
    const { data } = await getSupabase()
      .from("coo_tasks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    return (data ?? []) as CooTaskRow[];
  },
  ["db-coo-tasks"],
  { revalidate: 30, tags: ["admin-coo"] }
);

export async function readCooTasks(): Promise<CooTaskRow[]> {
  try { return await readCooTasksCached(); } catch { return []; }
}

// ---- affiliate clicks (migrated off the Sheet) ----------------------------

export type AffiliateClick = {
  id: string;
  timestamp: string;
  productId: string;
  productName: string;
  referer: string;
};

export async function readAffiliateClicks(): Promise<AffiliateClick[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data } = await getSupabase()
      .from("affiliate_clicks")
      .select("id, created_at, product_id, product_name, referer")
      .order("created_at", { ascending: false })
      .limit(5000);
    return ((data ?? []) as { id: string; created_at: string; product_id: string; product_name: string | null; referer: string | null }[]).map((c) => ({
      id: c.id,
      timestamp: c.created_at,
      productId: c.product_id,
      productName: c.product_name ?? "",
      referer: c.referer ?? "",
    }));
  } catch {
    return [];
  }
}

// ---- Weber sprint ticker ---------------------------------------------------

export async function readWeberSprintCount(): Promise<number> {
  const { WEBER_SPRINT } = await import("@/lib/campaign-weber");
  if (!isSupabaseConfigured()) return 0;
  try {
    const { count } = await getSupabase()
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("source", WEBER_SPRINT.source)
      .gte("created_at", WEBER_SPRINT.startISO)
      .lte("created_at", WEBER_SPRINT.endISO);
    return count ?? 0;
  } catch {
    return 0;
  }
}

// ---- gallery (admin-uploaded before/afters) --------------------------------

/**
 * All gallery_jobs rows (published + drafts) for the /admin Gallery manager.
 * Not cached — the admin list should reflect uploads/deletes immediately.
 */
export async function readGalleryJobs(): Promise<GalleryJobRow[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data } = await getSupabase()
      .from("gallery_jobs")
      .select("*")
      .order("date", { ascending: false })
      .limit(500);
    return (data ?? []) as GalleryJobRow[];
  } catch {
    return [];
  }
}

export async function readCooHistory(limit = 12): Promise<CooMessageRow[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await getSupabase()
    .from("coo_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as CooMessageRow[]).reverse();
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
