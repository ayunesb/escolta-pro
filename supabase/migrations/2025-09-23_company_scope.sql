-- Idempotent migration: create helper public.my_company_id() and RLS policies for company scoping
create or replace function public.my_company_id()
returns uuid stable language sql as $$
  select (current_setting('request.jwt.claims.company_id', true))::uuid
$$;

-- Ensure profiles table has company_id column
alter table if exists public.profiles add column if not exists company_id uuid;

-- Enable RLS where needed
alter table if exists public.profiles enable row level security;
alter table if exists public.staff enable row level security;
alter table if exists public.vehicles enable row level security;
alter table if exists public.bookings enable row level security;

-- Profiles: company admins can select/update rows belonging to their company
drop policy if exists profiles_company_admin on public.profiles;
create policy profiles_company_admin on public.profiles
  for select
  to authenticated
  using (company_id = public.my_company_id());

drop policy if exists profiles_company_admin_update on public.profiles;
create policy profiles_company_admin_update on public.profiles
  for update
  to authenticated
  using (company_id = public.my_company_id())
  with check (company_id = public.my_company_id());

-- Staff table policy
DO $$
BEGIN
  IF to_regclass('public.staff') IS NOT NULL THEN
    EXECUTE 'drop policy if exists staff_company_admin on public.staff;';
    EXECUTE 'create policy staff_company_admin on public.staff
      for all
      to authenticated
      using (company_id = public.my_company_id())
      with check (company_id = public.my_company_id());';
  END IF;
END$$;

-- Vehicles table policy
DO $$
BEGIN
  IF to_regclass('public.vehicles') IS NOT NULL THEN
    EXECUTE 'drop policy if exists vehicles_company_admin on public.vehicles;';
    EXECUTE 'create policy vehicles_company_admin on public.vehicles
      for all
      to authenticated
      using (company_id = public.my_company_id())
      with check (company_id = public.my_company_id());';
  END IF;
END$$;

-- Bookings: restrict access to company-scoped bookings
drop policy if exists bookings_company_scope on public.bookings;
create policy bookings_company_scope_select on public.bookings
  for select
  to authenticated
  using (assigned_company_id = public.my_company_id());

drop policy if exists bookings_company_scope_update on public.bookings;
create policy bookings_company_scope_update on public.bookings
  for update
  to authenticated
  using (assigned_company_id = public.my_company_id())
  with check (assigned_company_id = public.my_company_id());
