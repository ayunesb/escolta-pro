-- Migration: create stripe_failed_events table for dead-letter Stripe webhook events
-- Generated on 2025-09-25

-- Safety: create table if not exists (idempotent-ish for dev); in prod prefer explicit versioning
create table if not exists public.stripe_failed_events (
  id text primary key,
  type text not null,
  payload jsonb not null,
  error text not null,
  created_at timestamptz not null default now()
);

-- Optional index to query recent failures by time
create index if not exists idx_stripe_failed_events_created_at on public.stripe_failed_events (created_at desc);

-- RLS (assumes only service role or privileged backend should read). Disable RLS for now; tighten later with a secure view.
alter table public.stripe_failed_events enable row level security;

-- Allow only service role to access. For now, create a restrictive policy placeholder.
-- NOTE: Replace 'service_role' with actual role if defined in Auth; Supabase uses service key bypassing RLS.
create policy "service_read_stripe_failed_events" on public.stripe_failed_events
  for select using ( auth.role() = 'service_role' );

create policy "service_insert_stripe_failed_events" on public.stripe_failed_events
  for insert with check ( auth.role() = 'service_role' );

-- No update/delete policy intentionally (immutable log)
