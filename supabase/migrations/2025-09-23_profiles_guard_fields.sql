ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS phone_e164 text,
  ADD COLUMN IF NOT EXISTS kyc_status text DEFAULT 'missing',
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS company_id uuid,
  ADD COLUMN IF NOT EXISTS stripe_account_id text;

-- owner-only RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_owner_rw" ON public.profiles;
CREATE POLICY "profiles_owner_rw" ON public.profiles
  FOR SELECT USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
