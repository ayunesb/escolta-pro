-- Read with signed URLs only (no public read)
UPDATE storage.buckets SET public = false WHERE id IN ('profiles','kyc');

-- write: only owner can write to their folder
DROP POLICY IF EXISTS "write_own_profiles" ON storage.objects;
CREATE POLICY "write_own_profiles" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('profiles','kyc')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "update_own_profiles" ON storage.objects
  FOR UPDATE USING (
    bucket_id IN ('profiles','kyc')
    AND (storage.foldername(name))[1] = auth.uid()::text
  ) WITH CHECK (
    bucket_id IN ('profiles','kyc')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "select_own_profiles" ON storage.objects
  FOR SELECT USING (
    bucket_id IN ('profiles','kyc')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
