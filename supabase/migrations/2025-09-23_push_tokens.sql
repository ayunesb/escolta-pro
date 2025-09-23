-- Push tokens table for notifications
create table if not exists push_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  token text not null,
  platform text not null, -- 'ios', 'android', 'web'
  created_at timestamptz default now()
);

-- RLS: Only allow user to manage their own tokens
alter table push_tokens enable row level security;
create policy "User can read own push tokens" on push_tokens
  for select using (user_id = auth.uid());
create policy "User can insert own push token" on push_tokens
  for insert with check (user_id = auth.uid());
create policy "User can update own push token" on push_tokens
  for update using (user_id = auth.uid());
create policy "User can delete own push token" on push_tokens
  for delete using (user_id = auth.uid());
