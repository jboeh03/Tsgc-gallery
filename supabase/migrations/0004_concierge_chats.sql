-- Concierge chat logging: one row per chat session (keyed by a client-generated
-- session_id). The widget re-sends the full running transcript each turn, so the
-- server upserts the whole conversation by session_id — always complete, no
-- per-turn stitching. A row with message_count = 0 is an "opened but never typed"
-- session. RLS deny-all like every other table; service role only.
create table if not exists public.concierge_chats (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  session_id    text not null unique,
  transcript    jsonb not null default '[]'::jsonb,
  message_count integer not null default 0,
  converted     boolean not null default false,
  contact_id    uuid references public.contacts(id) on delete set null,
  ip            text
);

alter table public.concierge_chats enable row level security;

create index if not exists concierge_chats_created_at_idx
  on public.concierge_chats (created_at desc);
