-- Chat threads, participants, messages, RLS, helper, indexes, realtime
create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_participants (
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      text not null,
  last_read_at timestamptz,
  primary key (thread_id, user_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('text','image','file','system')),
  body text,
  media_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.chat_threads enable row level security;
alter table public.chat_participants enable row level security;
alter table public.chat_messages enable row level security;

create or replace function public.is_in_thread(t_id uuid)
returns boolean
language sql stable security definer set search_path=public as $$
  select exists (
    select 1 from public.chat_participants
    where thread_id = t_id and user_id = auth.uid()
  );
$$;

drop policy if exists chat_threads_rw on public.chat_threads;
create policy chat_threads_rw
on public.chat_threads
for all
to authenticated
using (public.is_in_thread(id))
with check (true);

drop policy if exists chat_participants_rw on public.chat_participants;
create policy chat_participants_rw
on public.chat_participants
for all
to authenticated
using (user_id = auth.uid() or public.is_in_thread(thread_id))
with check (public.is_in_thread(thread_id));

drop policy if exists chat_messages_rw on public.chat_messages;
create policy chat_messages_rw
on public.chat_messages
for all
to authenticated
using (public.is_in_thread(thread_id))
with check (sender_id = auth.uid() and public.is_in_thread(thread_id));

create index if not exists idx_chat_messages_thread_created on public.chat_messages(thread_id, created_at desc);
create index if not exists idx_chat_participants_user on public.chat_participants(user_id);

alter table public.chat_threads replica identity full;
alter table public.chat_participants replica identity full;
alter table public.chat_messages replica identity full;
alter publication supabase_realtime add table public.chat_threads, public.chat_participants, public.chat_messages;

create or replace function public.ensure_booking_thread(p_booking_id uuid)
returns uuid
language plpgsql security definer set search_path=public as $$
declare
  t_id uuid;
  v_client uuid;
  v_guard uuid;
  v_company uuid;
begin
  select id into t_id from chat_threads where booking_id = p_booking_id limit 1;
  if t_id is null then
    insert into chat_threads(booking_id, created_by)
    values (p_booking_id, auth.uid())
    returning id into t_id;

    select client_id into v_client from public.bookings where id = p_booking_id;
    select assigned_user_id into v_guard from public.bookings where id = p_booking_id;
    select company_id into v_company from public.bookings where id = p_booking_id;

    if v_client is not null then
      insert into chat_participants(thread_id, user_id, role)
      values (t_id, v_client, 'client')
      on conflict do nothing;
    end if;

    if v_guard is not null then
      insert into chat_participants(thread_id, user_id, role)
      values (t_id, v_guard, 'guard')
      on conflict do nothing;
    end if;

    if v_company is not null then
      insert into chat_participants(thread_id, user_id, role)
      select t_id, p.id, 'company_admin'
      from public.profiles p
      where p.company_id = v_company and p.role = 'company_admin'
      on conflict do nothing;
    end if;
  end if;
  return t_id;
end;
$$;
