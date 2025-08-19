-- Drop and recreate only the necessary policies without duplicates

-- Drop storage policy
DROP POLICY IF EXISTS "private buckets read" ON storage.objects;
DROP POLICY IF EXISTS "admin access to all buckets" ON storage.objects;
DROP POLICY IF EXISTS "users can read own objects" ON storage.objects;

-- Drop all document and org policies that might exist
DROP POLICY IF EXISTS "docs_insert_owner" ON public.documents;
DROP POLICY IF EXISTS "docs_read" ON public.documents;
DROP POLICY IF EXISTS "org_members_insert_admin" ON public.org_members;
DROP POLICY IF EXISTS "org_members_read" ON public.org_members;
DROP POLICY IF EXISTS "org_insert_admin" ON public.organizations;
DROP POLICY IF EXISTS "org_read_admin" ON public.organizations;

-- Now drop the view with CASCADE to handle any remaining dependencies
DROP VIEW IF EXISTS public.v_is_admin CASCADE;

-- Recreate storage policies
CREATE POLICY "admin access to all buckets"
ON storage.objects
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'company_admin'));

CREATE POLICY "users can read own objects"
ON storage.objects
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Recreate document policies without v_is_admin
CREATE POLICY "docs_insert_owner"
ON public.documents
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  (owner_type = 'profile' AND owner_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.org_members m
    WHERE m.org_id = documents.org_id
      AND m.profile_id = auth.uid()
      AND m.role = ANY (ARRAY['owner','admin','manager'])
  )
  OR public.has_role(auth.uid(), 'company_admin')
);

CREATE POLICY "docs_read"
ON public.documents
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  (owner_type = 'profile' AND owner_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.org_members m
    WHERE m.org_id = documents.org_id
      AND m.profile_id = auth.uid()
      AND m.role = ANY (ARRAY['owner','admin','manager'])
  )
  OR public.has_role(auth.uid(), 'company_admin')
);

-- Recreate org policies without v_is_admin
CREATE POLICY "org_members_insert_admin"
ON public.org_members
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'company_admin'));

CREATE POLICY "org_members_read"
ON public.org_members
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  (profile_id = auth.uid()) 
  OR public.has_role(auth.uid(), 'company_admin')
);

CREATE POLICY "org_insert_admin"
ON public.organizations
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'company_admin'));

CREATE POLICY "org_read_admin"
ON public.organizations
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'company_admin'));