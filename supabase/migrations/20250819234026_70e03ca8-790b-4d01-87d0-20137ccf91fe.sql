-- SECURITY FIXES MIGRATION
-- 1) Enable Row Level Security on all public tables (idempotent)
ALTER TABLE IF EXISTS public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.guard_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.guards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vehicles ENABLE ROW LEVEL SECURITY;

-- 2) Fix infinite recursion in profiles admin policy by using has_role() and make it PERMISSIVE
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'profiles' 
      AND policyname = 'profiles_admin'
  ) THEN
    DROP POLICY "profiles_admin" ON public.profiles;
  END IF;
END $$;

CREATE POLICY "profiles admin (definer-free)"
ON public.profiles
AS PERMISSIVE
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'company_admin'))
WITH CHECK (public.has_role(auth.uid(), 'company_admin'));

-- 3) Ensure public can read active guards without needing membership/company context
--    (permissive policy so it ORs with restrictive ones)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'guards' 
      AND policyname = 'active_guards_public_select'
  ) THEN
    CREATE POLICY active_guards_public_select
    ON public.guards
    AS PERMISSIVE
    FOR SELECT
    TO anon, authenticated
    USING (active = true);
  END IF;
END $$;

-- 4) Harden function search_path to avoid mutable resolution
CREATE OR REPLACE FUNCTION public.match_booking_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
begin
  if NEW.status = 'matching' then
    perform net.http_post(
      url := 'https://isnezquuwepqcjkaupjh.supabase.co/functions/v1/matching',
      headers := jsonb_build_object('Content-Type','application/json'),
      body := jsonb_build_object('booking_id', NEW.id::text)
    );
  end if;
  return NEW;
end;
$function$;
