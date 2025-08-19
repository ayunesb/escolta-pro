-- Replace v_is_admin references with has_role() and drop the view

-- 1) documents policies
DROP POLICY IF EXISTS "docs_insert_owner" ON public.documents;
CREATE POLICY "docs_insert_owner"
ON public.documents
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  (
    (owner_type = 'profile' AND owner_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = documents.org_id
        AND m.profile_id = auth.uid()
        AND m.role = ANY (ARRAY['owner','admin','manager'])
    )
    OR public.has_role(auth.uid(), 'company_admin')
  )
);

DROP POLICY IF EXISTS "docs_read" ON public.documents;
CREATE POLICY "docs_read"
ON public.documents
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  (
    (owner_type = 'profile' AND owner_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = documents.org_id
        AND m.profile_id = auth.uid()
        AND m.role = ANY (ARRAY['owner','admin','manager'])
    )
    OR public.has_role(auth.uid(), 'company_admin')
  )
);

-- 2) org_members policies
DROP POLICY IF EXISTS "org_members_insert_admin" ON public.org_members;
CREATE POLICY "org_members_insert_admin"
ON public.org_members
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'company_admin'));

DROP POLICY IF EXISTS "org_members_read" ON public.org_members;
CREATE POLICY "org_members_read"
ON public.org_members
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING ((profile_id = auth.uid()) OR public.has_role(auth.uid(), 'company_admin'));

-- 3) organizations policies
DROP POLICY IF EXISTS "org_insert_admin" ON public.organizations;
CREATE POLICY "org_insert_admin"
ON public.organizations
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'company_admin'));

DROP POLICY IF EXISTS "org_read_admin" ON public.organizations;
CREATE POLICY "org_read_admin"
ON public.organizations
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'company_admin'));

-- 4) Drop the v_is_admin view to remove Security Definer View
DROP VIEW IF EXISTS public.v_is_admin;