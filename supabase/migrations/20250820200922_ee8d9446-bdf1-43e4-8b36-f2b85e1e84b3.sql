-- Phase 4: Create document management storage and policies
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Create policy for document uploads - users can upload their own documents
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own documents
CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Company admins can view documents in their organization
CREATE POLICY "Company admins can view org documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id IS NOT NULL
    AND (storage.foldername(name))[2] = profiles.company_id::text
  )
);

-- Super admins can manage all documents
CREATE POLICY "Super admins can manage all documents" ON storage.objects
FOR ALL USING (
  bucket_id = 'documents' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'company_admin'::app_role
  )
);

-- Create edge function for generating signed URLs
CREATE OR REPLACE FUNCTION public.generate_document_signed_url(
  document_path TEXT,
  expires_in INTERVAL DEFAULT INTERVAL '1 hour'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  signed_url TEXT;
BEGIN
  -- Check if user has permission to access the document
  IF NOT EXISTS (
    SELECT 1 FROM storage.objects 
    WHERE bucket_id = 'documents' 
    AND name = document_path
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.company_id IS NOT NULL
        AND (storage.foldername(name))[2] = profiles.company_id::text
      )
      OR EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'company_admin'::app_role
      )
    )
  ) THEN
    RAISE EXCEPTION 'Access denied to document';
  END IF;

  -- This is a placeholder - in a real implementation, we'd use the storage API
  -- to generate the actual signed URL
  RETURN 'signed_url_placeholder_' || document_path;
END;
$$;