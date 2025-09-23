-- booking_drafts table
create table if not exists booking_drafts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  step text not null,
  payload jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: Only allow user to read/write their own drafts
alter table booking_drafts enable row level security;
create policy "Client can read own draft" on booking_drafts
  for select using (user_id = auth.uid());
create policy "Client can write own draft" on booking_drafts
  for insert with check (user_id = auth.uid());
create policy "Client can update own draft" on booking_drafts
  for update using (user_id = auth.uid());
create policy "Client can delete own draft" on booking_drafts
  for delete using (user_id = auth.uid());