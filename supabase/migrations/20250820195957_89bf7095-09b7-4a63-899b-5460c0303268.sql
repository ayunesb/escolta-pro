-- Safe delta migration - only add new columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_account_id text;
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);