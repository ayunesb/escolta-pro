-- Phase 1: Critical security fixes for guards exposure
-- 1) Drop overly-permissive public SELECT policies on guards
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'guards' AND policyname = 'Active guards are publicly visible for booking'
  ) THEN
    EXECUTE 'DROP POLICY "Active guards are publicly visible for booking" ON public.guards;';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'guards' AND policyname = 'active_guards_public_select'
  ) THEN
    EXECUTE 'DROP POLICY "active_guards_public_select" ON public.guards;';
  END IF;
END $$;

-- 2) Ensure owners and company admins can still read their guards (already present)
--    Keep existing policies: "guards readable by owner or company admin", "guards update by company admin", "guards write by company admin"

-- 3) Create a SECURITY DEFINER function that returns only safe, public fields for active guards
CREATE OR REPLACE FUNCTION public.get_public_guards()
RETURNS TABLE (
  id uuid,
  photo_url text,
  rating numeric,
  city text,
  hourly_rate_mxn_cents integer,
  armed_hourly_surcharge_mxn_cents integer,
  dress_codes text[]
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    g.id,
    g.photo_url,
    g.rating,
    g.city,
    g.hourly_rate_mxn_cents,
    g.armed_hourly_surcharge_mxn_cents,
    g.dress_codes
  FROM public.guards g
  WHERE g.active = true;
$$;

-- 4) Optional: function to fetch single guard by id with safe fields
CREATE OR REPLACE FUNCTION public.get_public_guard_by_id(_id uuid)
RETURNS TABLE (
  id uuid,
  photo_url text,
  rating numeric,
  city text,
  hourly_rate_mxn_cents integer,
  armed_hourly_surcharge_mxn_cents integer,
  dress_codes text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    g.id,
    g.photo_url,
    g.rating,
    g.city,
    g.hourly_rate_mxn_cents,
    g.armed_hourly_surcharge_mxn_cents,
    g.dress_codes
  FROM public.guards g
  WHERE g.active = true AND g.id = _id;
$$;

-- 5) Restrict column-level privileges for authenticated role on guards (defense in depth)
--    Allow reading only non-sensitive columns for general authenticated users. Company admins/owners unaffected due to RLS + role-based access.
DO $$
DECLARE
  r regrole;
BEGIN
  SELECT oid INTO r FROM pg_roles WHERE rolname = 'authenticated';
  IF r IS NOT NULL THEN
    -- Revoke broad selects first
    EXECUTE 'REVOKE SELECT ON TABLE public.guards FROM authenticated;';
    -- Grant column-level select on safe fields only
    EXECUTE 'GRANT SELECT (id, photo_url, rating, city, hourly_rate, hourly_rate_mxn_cents, armed_hourly_surcharge_mxn_cents, availability_status, dress_codes) ON public.guards TO authenticated;';
  END IF;
END $$;

-- Note: Frontend should migrate to using RPC functions above for public guard reads.
