-- Payments & payouts: Add Stripe payout history table
create table if not exists payouts (
  id uuid default gen_random_uuid() primary key,
  guard_id uuid not null references profiles(id) on delete cascade,
  amount numeric not null,
  currency text not null default 'mxn',
  stripe_payout_id text,
  status text not null,
  created_at timestamptz default now(),
  paid_at timestamptz
);

-- RLS: Only allow guard to read their own payouts
alter table payouts enable row level security;
create policy "Guard can read own payouts" on payouts
  for select using (guard_id = auth.uid());
