-- Fix storage policy and then drop v_is_admin view

-- First, let's check the current storage policy using a query
-- This query will help us understand the current policy structure
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
  AND policyname LIKE '%private%buckets%read%';

-- Drop the problematic storage policy that depends on v_is_admin
DROP POLICY IF EXISTS "private buckets read" ON storage.objects;

-- Create a new storage policy using has_role instead
CREATE POLICY "admin access to all buckets"
ON storage.objects
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'company_admin'));

-- Also create the standard user policy for their own objects  
CREATE POLICY "users can read own objects"
ON storage.objects
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Now we can safely drop the v_is_admin view
DROP VIEW IF EXISTS public.v_is_admin;