-- Create messages table for bookings with RLS
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

-- helper: user is participant if they are client, assigned guard, or company admin for booking
create or replace function public.is_booking_participant(bid uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from public.bookings b
    where b.id = bid and (
      b.client_id = auth.uid()
      or b.assigned_user_id = auth.uid()
      or b.company_id = public.my_company_id()
    )
  );
$$;

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select to authenticated
  using (public.is_booking_participant(booking_id));

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert to authenticated
  with check (sender_id = auth.uid() and public.is_booking_participant(booking_id));

drop policy if exists messages_update on public.messages;
create policy messages_update on public.messages
  for update to authenticated
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());
