-- Drop existing conflicting function first
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- =========================
-- ROLES & HELPERS
-- =========================

-- 1) Role enum
do $$ begin
  create type app_role as enum ('client','freelancer','company_admin','super_admin');
exception when duplicate_object then null; end $$;

-- 3) helper: has_role(uid, role) - recreate with correct parameter names
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