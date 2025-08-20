-- Storage access policies for private buckets: licenses, vehicles, incidents
-- Grant authenticated owners full CRUD on their own objects and company_admin full access

-- SELECT policy: owners and company_admin can read
CREATE POLICY IF NOT EXISTS "storage_select_owner_or_admin_restricted_buckets"
ON storage.objects
FOR SELECT
USING (
  bucket_id IN ('licenses', 'vehicles', 'incidents')
  AND (
    owner = auth.uid()
    OR public.has_role(auth.uid(), 'company_admin'::app_role)
  )
);

-- INSERT policy: owners and company_admin can insert
CREATE POLICY IF NOT EXISTS "storage_insert_owner_or_admin_restricted_buckets"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id IN ('licenses', 'vehicles', 'incidents')
  AND (
    owner = auth.uid()
    OR public.has_role(auth.uid(), 'company_admin'::app_role)
  )
);

-- UPDATE policy: owners and company_admin can update
CREATE POLICY IF NOT EXISTS "storage_update_owner_or_admin_restricted_buckets"
ON storage.objects
FOR UPDATE
USING (
  bucket_id IN ('licenses', 'vehicles', 'incidents')
  AND (
    owner = auth.uid()
    OR public.has_role(auth.uid(), 'company_admin'::app_role)
  )
)
WITH CHECK (
  bucket_id IN ('licenses', 'vehicles', 'incidents')
  AND (
    owner = auth.uid()
    OR public.has_role(auth.uid(), 'company_admin'::app_role)
  )
);

-- DELETE policy: owners and company_admin can delete
CREATE POLICY IF NOT EXISTS "storage_delete_owner_or_admin_restricted_buckets"
ON storage.objects
FOR DELETE
USING (
  bucket_id IN ('licenses', 'vehicles', 'incidents')
  AND (
    owner = auth.uid()
    OR public.has_role(auth.uid(), 'company_admin'::app_role)
  )
);
