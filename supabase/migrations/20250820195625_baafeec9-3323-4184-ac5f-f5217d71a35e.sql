-- =========================
-- ROLES & HELPERS
-- =========================

-- 1) Role enum
do $$ begin
  create type app_role as enum ('client','freelancer','company_admin','super_admin');
exception when duplicate_object then null; end $$;

-- 2) Who has what role?
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

-- 3) helper: has_role(uid, role)
create or replace function public.has_role(uid uuid, wanted app_role)
returns boolean language sql stable as $$
  select exists (select 1 from public.user_roles ur where ur.user_id = uid and ur.role = wanted)
$$;

-- 4) helper: company membership (admin)
create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  unique(company_id, user_id)
);

create or replace function public.is_company_admin(uid uuid, cid uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from public.company_members m
    where m.company_id = cid and m.user_id = uid and m.role in ('admin','owner')
  )
$$;

-- =========================
-- PROFILES / COMPANIES / GUARDS
-- =========================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  phone_e164 text,
  photo_url text,
  stripe_account_id text,         -- for freelancer payouts
  kyc_status text default 'none',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tax_id text,
  city text,
  contact_name text,
  contact_email text,
  contact_phone text,
  logo_url text,
  stripe_account_id text,         -- for company payouts
  status text not null default 'pending_review', -- pending_review|approved|suspended
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Guards are freelancer profiles; can optionally belong to a company
create table if not exists public.guards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  hourly_rate_mxn_cents integer not null default 80000,  -- MX$800/hr
  vehicle_hourly_rate_mxn_cents integer,                 -- optional
  armed boolean default false,
  rating numeric default 5.0,
  bio text,
  photo_url text,
  status text not null default 'inactive',               -- inactive|active
  created_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  guard_id uuid references public.guards(id) on delete set null,
  type text,              -- SUV|Sedan|Van|Moto
  armored boolean default false,
  hourly_rate_mxn_cents integer not null default 350000, -- MX$3,500/hr
  plate text,
  photo_url text,
  active boolean default true,
  created_at timestamptz not null default now()
);

-- =========================
-- BOOKINGS / ASSIGNMENTS / PAYMENTS / PAYOUTS
-- =========================

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  assigned_user_id uuid references auth.users(id),
  assigned_company_id uuid references public.companies(id),
  status text not null default 'matching', -- matching|assigned|enroute|onsite|in_progress|completed|canceled|failed
  start_ts timestamptz,
  end_ts timestamptz,
  hours integer not null default 4,
  armed_required boolean default false,
  vehicle_required boolean default false,
  vehicle_type text,
  notes text,
  subtotal_mxn_cents integer,
  service_fee_mxn_cents integer,
  total_mxn_cents integer,
  currency text not null default 'MXN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  guard_id uuid not null references public.guards(id) on delete cascade,
  company_id uuid references public.companies(id),
  status text not null default 'offered', -- offered|accepted|declined|completed
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  provider text not null default 'stripe',
  status text not null default 'preauthorized', -- preauthorized|captured|refunded|failed
  amount_mxn_cents integer not null,
  provider_intent_id text,
  provider_charge_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  guard_id uuid references public.guards(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  amount_mxn_cents integer not null,
  status text not null default 'pending', -- pending|paid|failed
  period_start date,
  period_end date,
  created_at timestamptz not null default now()
);

-- =========================
-- DOCUMENTS (KYC / licenses)
-- =========================
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  owner_type text not null, -- client|freelancer|company
  doc_type text not null,   -- ine|passport|gun_permit|license|insurance|permit
  file_path text not null,  -- storage path (private bucket)
  status text not null default 'pending', -- pending|approved|rejected
  created_at timestamptz not null default now()
);

-- =========================
-- RLS ON
-- =========================
alter table public.user_roles enable row level security;
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.guards enable row level security;
alter table public.vehicles enable row level security;
alter table public.bookings enable row level security;
alter table public.assignments enable row level security;
alter table public.payments enable row level security;
alter table public.payouts enable row level security;
alter table public.documents enable row level security;

-- =========================
-- POLICIES
-- =========================

-- user_roles (read own roles; super_admin full)
drop policy if exists ur_select on public.user_roles;
create policy ur_select on public.user_roles
for select to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(),'super_admin'));

-- profiles (self RW; super_admin full)
drop policy if exists pr_sel on public.profiles;
create policy pr_sel on public.profiles
for select to authenticated
using (id = auth.uid() or public.has_role(auth.uid(),'super_admin'));

drop policy if exists pr_upd on public.profiles;
create policy pr_upd on public.profiles
for update to authenticated
using (id = auth.uid() or public.has_role(auth.uid(),'super_admin'))
with check (id = auth.uid() or public.has_role(auth.uid(),'super_admin'));

-- companies (company_admins + super_admin)
drop policy if exists co_sel on public.companies;
create policy co_sel on public.companies
for select to authenticated
using (public.has_role(auth.uid(),'super_admin') or public.is_company_admin(auth.uid(), id));

drop policy if exists co_upd on public.companies;
create policy co_upd on public.companies
for update to authenticated
using (public.has_role(auth.uid(),'super_admin') or public.is_company_admin(auth.uid(), id))
with check (public.has_role(auth.uid(),'super_admin') or public.is_company_admin(auth.uid(), id));

-- company_members (visible to admins of that company + super_admin)
drop policy if exists cm_sel on public.company_members;
create policy cm_sel on public.company_members
for select to authenticated
using (public.has_role(auth.uid(),'super_admin') or public.is_company_admin(auth.uid(), company_id));

-- guards (owner or company_admin of their company; public browse active)
drop policy if exists g_sel on public.guards;
create policy g_sel on public.guards
for select to authenticated
using (
  status='active'
  or user_id = auth.uid()
  or public.has_role(auth.uid(),'super_admin')
  or (company_id is not null and public.is_company_admin(auth.uid(), company_id))
);

drop policy if exists g_upd on public.guards;
create policy g_upd on public.guards
for update to authenticated
using (user_id = auth.uid() or public.is_company_admin(auth.uid(), company_id) or public.has_role(auth.uid(),'super_admin'))
with check (user_id = auth.uid() or public.is_company_admin(auth.uid(), company_id) or public.has_role(auth.uid(),'super_admin'));

-- vehicles (company scoped)
drop policy if exists v_sel on public.vehicles;
create policy v_sel on public.vehicles
for select to authenticated
using (
  active = true
  or public.has_role(auth.uid(),'super_admin')
  or (company_id is not null and public.is_company_admin(auth.uid(), company_id))
);

drop policy if exists v_upd on public.vehicles;
create policy v_upd on public.vehicles
for insert to authenticated
with check (company_id is not null and public.is_company_admin(auth.uid(), company_id));

create policy v_upd2 on public.vehicles
for update to authenticated
using (company_id is not null and public.is_company_admin(auth.uid(), company_id))
with check (company_id is not null and public.is_company_admin(auth.uid(), company_id));

-- bookings (participants + admins)
drop policy if exists b_sel on public.bookings;
create policy b_sel on public.bookings
for select to authenticated
using (
  client_id = auth.uid()
  or assigned_user_id = auth.uid()
  or (assigned_company_id is not null and public.is_company_admin(auth.uid(), assigned_company_id))
  or public.has_role(auth.uid(),'super_admin')
);

-- inserts/updates only via edge functions (service role); no direct RW from client app
drop policy if exists b_ins on public.bookings;
create policy b_ins on public.bookings for insert to service_role with check (true);
drop policy if exists b_upd on public.bookings;
create policy b_upd on public.bookings for update to service_role using (true) with check (true);

-- assignments (guard/company visibility)
drop policy if exists a_sel on public.assignments;
create policy a_sel on public.assignments
for select to authenticated
using (
  exists(select 1 from public.guards g where g.id = assignments.guard_id and g.user_id = auth.uid())
  or (company_id is not null and public.is_company_admin(auth.uid(), company_id))
  or public.has_role(auth.uid(),'super_admin')
);

-- payments (client of booking and super/company admins)
drop policy if exists pay_sel on public.payments;
create policy pay_sel on public.payments
for select to authenticated
using (
  exists (select 1 from public.bookings b where b.id = payments.booking_id and b.client_id = auth.uid())
  or public.has_role(auth.uid(),'super_admin')
  or exists (select 1 from public.bookings b where b.id = payments.booking_id and b.assigned_company_id is not null and public.is_company_admin(auth.uid(), b.assigned_company_id))
);

-- payouts (freelancer or company admins + super)
drop policy if exists pout_sel on public.payouts;
create policy pout_sel on public.payouts
for select to authenticated
using (
  exists(select 1 from public.guards g where g.id = payouts.guard_id and g.user_id = auth.uid())
  or (company_id is not null and public.is_company_admin(auth.uid(), company_id))
  or public.has_role(auth.uid(),'super_admin')
);

-- documents (owner; admins for relevant company)
drop policy if exists doc_sel on public.documents;
create policy doc_sel on public.documents
for select to authenticated
using (
  owner_id = auth.uid()
  or public.has_role(auth.uid(),'super_admin')
);

-- =========================
-- STORAGE (private buckets) policies
-- Buckets expected: avatars (public read), licenses, vehicles, company_docs, incidents
-- =========================
-- storage is in schema "storage". Apply owner/self access for private buckets.
drop policy if exists st_sel on storage.objects;
create policy st_sel on storage.objects
for select to authenticated
using (
  -- public avatars readable by anyone
  bucket_id = 'avatars'
  or (bucket_id in ('licenses','vehicles','company_docs','incidents') and owner = auth.uid())
  or public.has_role(auth.uid(),'super_admin')
);

drop policy if exists st_ins on storage.objects;
create policy st_ins on storage.objects
for insert to authenticated
with check (
  (bucket_id in ('licenses','vehicles','company_docs','incidents') and owner = auth.uid())
  or (bucket_id='avatars' and owner = auth.uid())
);

drop policy if exists st_del on storage.objects;
create policy st_del on storage.objects
for delete to authenticated
using (owner = auth.uid() or public.has_role(auth.uid(),'super_admin'));