/**
 * Hand-authored types for the Phase 1 schema (supabase/migrations/0001_phase1_core.sql).
 *
 * Kept in sync with the migration by hand. The `Database` type powers the
 * typed supabase-js client; the domain types below are what the app passes
 * around. The Lead/Job aliases re-export the existing admin shapes so the
 * /admin read-layer flip (Sheets → Supabase) is a drop-in (same types).
 */

import type { Lead, Job } from "@/lib/admin/sheets";

export type { Lead, Job };

// ---- enums -----------------------------------------------------------------
export type PipelineStatus =
  | "new" | "quoted" | "booked" | "scheduled"
  | "completed" | "invoiced" | "paid" | "review" | "lost";
export type ContactKind = "lead" | "customer";
export type MessageDirection = "inbound" | "outbound";
export type MessageChannel = "sms" | "email";
export type DraftStatus = "suggested" | "edited" | "sent" | "dismissed";
export type AppointmentStatus = "proposed" | "confirmed" | "completed" | "canceled" | "no_show";
export type EventKind =
  | "lead_created" | "message_in" | "message_out" | "draft_generated"
  | "status_change" | "appointment_created" | "appointment_confirmed"
  | "mirror_synced" | "webhook_received" | "error" | "agent_run" | "backlog";

// ---- row types -------------------------------------------------------------
export type ContactRow = {
  id: string;
  created_at: string;
  updated_at: string;
  phone_e164: string | null;
  name: string | null;
  email: string | null;
  zip: string | null;
  kind: ContactKind;
  source: string | null;
  referred_by: string | null;
  service_address: string | null;
  grill_brand: string | null;
  grill_type: string | null;
  grill_model: string | null;
  grill_burner_count: number | null;
  sms_consent: boolean;
  sms_consent_at: string | null;
  sms_opt_out: boolean;
  notes: string | null;
  preferred_contact: string | null;
  legacy_lead_id: string | null;
  legacy_sheet_row: number | null;
};

export type JobRow = {
  id: string;
  created_at: string;
  updated_at: string;
  contact_id: string | null;
  status: PipelineStatus;
  service: string | null;
  source: string | null;
  referred_by: string | null;
  notes: string | null;
  date_quoted: string | null;
  quote_amount: number | null;
  date_booked: string | null;
  tech: string | null;
  job_address: string | null;
  grill_brand: string | null;
  grill_type: string | null;
  grill_model: string | null;
  burner_count: number | null;
  date_completed: string | null;
  invoice_num: string | null;
  invoice_amount: number | null;
  date_paid: string | null;
  pay_method: string | null;
  review_requested: boolean;
  review_received: boolean;
  review_notes: string | null;
  legacy_lead_id: string | null;
};

export type ConversationRow = {
  id: string;
  created_at: string;
  updated_at: string;
  contact_id: string;
  twilio_number: string | null;
  last_message_at: string | null;
  last_direction: MessageDirection | null;
  unread: boolean;
  status: string;
  linked_job_id: string | null;
};

export type MessageRow = {
  id: string;
  created_at: string;
  conversation_id: string;
  direction: MessageDirection;
  channel: MessageChannel;
  body: string | null;
  media_urls: string[];
  from_e164: string | null;
  to_e164: string | null;
  twilio_sid: string | null;
  status: string | null;
  ai_generated: boolean;
};

export type DraftRow = {
  id: string;
  created_at: string;
  conversation_id: string;
  body: string | null;
  status: DraftStatus;
  missing_fields: string[];
  model: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
};

export type AppointmentRow = {
  id: string;
  created_at: string;
  updated_at: string;
  contact_id: string | null;
  job_id: string | null;
  status: AppointmentStatus;
  scheduled_date: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  area_id: string | null;
  service_address: string | null;
  tech: string | null;
  notes: string | null;
  booking_token: string | null;
  confirmed_at: string | null;
  gcal_event_id: string | null;
  gcal_url: string | null;
};

export type EventRow = {
  id: string;
  created_at: string;
  kind: EventKind;
  contact_id: string | null;
  job_id: string | null;
  conversation_id: string | null;
  meta: Record<string, unknown>;
};

export type MarketingDraftRow = {
  id: string;
  created_at: string;
  job_id: string | null;
  kind: string;
  body: string | null;
  status: string; // new | used | dismissed
};

export type BacklogRow = {
  id: string;
  created_at: string;
  title: string;
  detail: string | null;
  category: string | null; // feature | bug | improvement | growth
  priority: string | null; // high | medium | low
  status: string; // open | done | dismissed
  source: string;
};

export type AffiliateClickRow = {
  id: string;
  created_at: string;
  product_id: string;
  product_name: string | null;
  affiliate: string | null;
  destination_url: string | null;
  referer: string | null;
  user_agent: string | null;
};

export type GiveawayEntryRow = {
  id: string;
  created_at: string;
  giveaway_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  zip: string | null;
  booking_ref: string | null;
  base_entries: number;
  bonus_booking: number;
  bonus_share: number;
  bonus_follow: number;
  total_entries: number;
  source: string | null;
};

export type CooRole = "user" | "assistant";
export type CooMessageRow = {
  id: string;
  created_at: string;
  role: CooRole;
  content: string;
  meta: Record<string, unknown>;
};

export type CooTaskStatus = "proposed" | "approved" | "in_progress" | "done" | "dismissed";
export type CooTaskRow = {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  detail: string | null;
  assignee: string | null;
  status: CooTaskStatus;
  priority: string | null;
  source_message_id: string | null;
  meta: Record<string, unknown>;
};

// ---- composed view types (used by the inbox UI) ----------------------------
export type ConversationSummary = ConversationRow & {
  contact: Pick<ContactRow, "id" | "name" | "phone_e164" | "service_address"> | null;
  lastMessageBody: string | null;
};

export type ConversationThread = ConversationRow & {
  contact: ContactRow | null;
  job: JobRow | null;
  messages: MessageRow[];
  activeDraft: DraftRow | null;
};

// ---- typed-client Database shape -------------------------------------------
// Matches the shape supabase-js expects (GenericSchema): each table carries
// Row/Insert/Update/Relationships, and empty slots use the {[_ in never]:never}
// idiom that the official generated types use. Insert/Update allow partials
// (DB defaults fill the rest).
type Tbl<R> = { Row: R; Insert: Partial<R>; Update: Partial<R>; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      contacts: Tbl<ContactRow>;
      jobs: Tbl<JobRow>;
      conversations: Tbl<ConversationRow>;
      messages: Tbl<MessageRow>;
      drafts: Tbl<DraftRow>;
      appointments: Tbl<AppointmentRow>;
      events: Tbl<EventRow>;
      rate_events: Tbl<{ id: string; bucket: string; created_at: string }>;
      marketing_drafts: Tbl<MarketingDraftRow>;
      backlog: Tbl<BacklogRow>;
      coo_messages: Tbl<CooMessageRow>;
      coo_tasks: Tbl<CooTaskRow>;
      affiliate_clicks: Tbl<AffiliateClickRow>;
      giveaway_entries: Tbl<GiveawayEntryRow>;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      pipeline_status: PipelineStatus;
      contact_kind: ContactKind;
      message_direction: MessageDirection;
      message_channel: MessageChannel;
      draft_status: DraftStatus;
      appointment_status: AppointmentStatus;
      event_kind: EventKind;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
