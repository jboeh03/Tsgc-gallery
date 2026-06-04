-- Phase 1 — Comms + Scheduling Hub: system of record
--
-- This is the source of truth that /admin reads AND writes. The Google Sheet
-- becomes a downstream mirror (see app/api/export/crm/route.ts).
--
-- RLS posture: every table has RLS enabled with NO anon/authenticated policies
-- (deny-all). The Next.js server reaches this DB only with the service-role key,
-- which bypasses RLS by design. No Supabase client is ever shipped to the browser.
--
-- Apply via the Supabase MCP apply_migration, or psql. Re-runnable: guarded with
-- IF NOT EXISTS where Postgres allows.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type pipeline_status as enum
    ('new','quoted','booked','scheduled','completed','invoiced','paid','review','lost');
exception when duplicate_object then null; end $$;

do $$ begin
  create type contact_kind as enum ('lead','customer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type message_direction as enum ('inbound','outbound');
exception when duplicate_object then null; end $$;

do $$ begin
  create type message_channel as enum ('sms','email');  -- email reserved for the Gmail phase
exception when duplicate_object then null; end $$;

do $$ begin
  create type draft_status as enum ('suggested','edited','sent','dismissed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type appointment_status as enum ('proposed','confirmed','completed','canceled','no_show');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_kind as enum
    ('lead_created','message_in','message_out','draft_generated','status_change',
     'appointment_created','appointment_confirmed','mirror_synced','webhook_received');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger
  language plpgsql
  set search_path = ''   -- hardened: no mutable search_path
as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- ---------------------------------------------------------------------------
-- contacts — one row per person (the SMS dedup target)
-- ---------------------------------------------------------------------------
create table if not exists contacts (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  phone_e164        text unique,                 -- +1XXXXXXXXXX, the inbound-SMS dedup key
  name              text,
  email             text,
  zip               text,
  kind              contact_kind not null default 'lead',
  source            text,                        -- website-quote-form, preview-tool, giveaway, sms-inbound, manual
  referred_by       text,
  service_address   text,                        -- quote-required; never rendered on the public map
  grill_brand       text,
  grill_type        text,
  grill_model       text,
  grill_burner_count int,
  sms_consent       boolean not null default false,
  sms_consent_at    timestamptz,
  sms_opt_out       boolean not null default false,
  notes             text,
  legacy_lead_id    text,                        -- sheet LEAD_ID / prev_… ; backfill + dedup key
  legacy_sheet_row  int
);
create index if not exists contacts_phone_idx on contacts (phone_e164);
create index if not exists contacts_legacy_idx on contacts (legacy_lead_id);
drop trigger if exists contacts_touch on contacts;
create trigger contacts_touch before update on contacts
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- jobs — the pipeline record (full 📋 CRM + Jobs sheet column set, normalized)
-- ---------------------------------------------------------------------------
create table if not exists jobs (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  contact_id      uuid references contacts(id) on delete set null,
  status          pipeline_status not null default 'new',
  service         text,
  source          text,
  referred_by     text,
  notes           text,
  -- quote
  date_quoted     date,
  quote_amount    numeric(10,2),
  -- booking / schedule snapshot
  date_booked     date,
  tech            text,
  job_address     text,
  -- grill snapshot at job time
  grill_brand     text,
  grill_type      text,
  grill_model     text,
  burner_count    int,
  -- completion / billing
  date_completed  date,
  invoice_num     text,
  invoice_amount  numeric(10,2),
  date_paid       date,
  pay_method      text,
  -- reviews
  review_requested boolean not null default false,
  review_received  boolean not null default false,
  review_notes     text,
  legacy_lead_id   text
);
create index if not exists jobs_contact_idx on jobs (contact_id);
create index if not exists jobs_status_idx on jobs (status);
create index if not exists jobs_legacy_idx on jobs (legacy_lead_id);
drop trigger if exists jobs_touch on jobs;
create trigger jobs_touch before update on jobs
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- conversations — one SMS thread per contact
-- ---------------------------------------------------------------------------
create table if not exists conversations (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  contact_id      uuid not null references contacts(id) on delete cascade,
  twilio_number   text,                          -- the Tri-State Twilio number this thread is on
  last_message_at timestamptz,
  last_direction  message_direction,
  unread          boolean not null default false,
  status          text not null default 'open',  -- open | snoozed | closed
  linked_job_id   uuid references jobs(id) on delete set null,
  unique (contact_id, twilio_number)
);
create index if not exists conversations_last_msg_idx on conversations (last_message_at desc);
drop trigger if exists conversations_touch on conversations;
create trigger conversations_touch before update on conversations
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- messages — every SMS in/out (idempotency anchored on twilio_sid)
-- ---------------------------------------------------------------------------
create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  direction       message_direction not null,
  channel         message_channel not null default 'sms',
  body            text,
  media_urls      text[] not null default '{}',  -- MMS grill photos count as a quote input
  from_e164       text,
  to_e164         text,
  twilio_sid      text unique,                   -- webhook-retry idempotency key
  status          text,                          -- queued | sent | delivered | failed | received
  ai_generated    boolean not null default false
);
create index if not exists messages_conversation_idx on messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- drafts — AI-suggested replies (human-in-the-loop; one active per conversation)
-- ---------------------------------------------------------------------------
create table if not exists drafts (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  body            text,
  status          draft_status not null default 'suggested',
  missing_fields  text[] not null default '{}',
  model           text,
  prompt_tokens   int,
  completion_tokens int
);
create index if not exists drafts_conversation_idx on drafts (conversation_id);
-- at most one active suggested draft per conversation
create unique index if not exists drafts_one_active_idx
  on drafts (conversation_id) where status = 'suggested';

-- ---------------------------------------------------------------------------
-- appointments — schedule (supersedes data/schedule.json)
-- ---------------------------------------------------------------------------
create table if not exists appointments (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  contact_id      uuid references contacts(id) on delete set null,
  job_id          uuid references jobs(id) on delete set null,
  status          appointment_status not null default 'proposed',
  scheduled_date  date,
  scheduled_start time,
  scheduled_end   time,
  area_id         text,                          -- keys into lib/areas.ts for the public map pin
  service_address text,                          -- PRIVATE — never rendered on the public map
  tech            text,
  notes           text,
  booking_token   text unique,                   -- for the customer self-serve link
  confirmed_at    timestamptz
);
create index if not exists appointments_date_idx on appointments (scheduled_date);
create index if not exists appointments_job_idx on appointments (job_id);
drop trigger if exists appointments_touch on appointments;
create trigger appointments_touch before update on appointments
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- events — durable audit log
-- ---------------------------------------------------------------------------
create table if not exists events (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  kind            event_kind not null,
  contact_id      uuid references contacts(id) on delete set null,
  job_id          uuid references jobs(id) on delete set null,
  conversation_id uuid references conversations(id) on delete set null,
  meta            jsonb not null default '{}'::jsonb
);
create index if not exists events_kind_idx on events (kind, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS: enable on every table, deny-all (no policies). Service role bypasses.
-- ---------------------------------------------------------------------------
alter table contacts      enable row level security;
alter table jobs          enable row level security;
alter table conversations enable row level security;
alter table messages      enable row level security;
alter table drafts        enable row level security;
alter table appointments  enable row level security;
alter table events        enable row level security;
