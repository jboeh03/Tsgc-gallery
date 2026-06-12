-- Phase 1 — Premium parts storefront: guest orders
--
-- One row per checkout attempt for the /parts storefront. Mirrors the
-- pending_bookings pattern: the checkout route writes a 'pending' row, the
-- Stripe session carries only this row's id, and the webhook (plus the
-- /parts/success reconcile fallback) fulfills exactly-once by claiming
-- fulfilled_at (null -> now) under a compare-and-set.
--
-- RLS posture matches the rest of the schema: enabled, NO policies (deny-all).
-- Only the service-role Next.js server touches it. line_items is a JSONB
-- snapshot of the cart, re-priced server-side from lib/parts/catalog.ts.

create extension if not exists "pgcrypto";

create table if not exists parts_orders (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  status            text not null default 'pending',  -- pending | fulfilling | fulfilled
  stripe_session_id text,
  first_name        text,
  last_name         text,
  phone_e164        text,
  email             text,
  fulfillment       text not null check (fulfillment in ('ship', 'install')),
  ship_address      text,
  service_address   text,
  preferred_date    date,
  preferred_time    text,
  line_items        jsonb not null default '[]'::jsonb,
  subtotal          numeric(10, 2),
  shipping_fee      numeric(10, 2) not null default 0,
  amount            numeric(10, 2),
  fulfilled_at      timestamptz,                        -- CAS claim column
  fulfilled_job_id  uuid references jobs(id)
);

alter table parts_orders enable row level security; -- no policies = deny-all

drop trigger if exists parts_orders_set_updated_at on parts_orders;
create trigger parts_orders_set_updated_at
  before update on parts_orders
  for each row execute function set_updated_at();

create index if not exists parts_orders_session_idx on parts_orders (stripe_session_id);
create index if not exists parts_orders_status_idx on parts_orders (status);
