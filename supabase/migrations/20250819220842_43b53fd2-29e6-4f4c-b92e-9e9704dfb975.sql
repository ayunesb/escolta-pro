-- Fix infinite recursion in user_roles RLS policies
-- The issue is that has_role function queries user_roles, but user_roles policies call has_role

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;

-- Create simple, non-recursive policies for user_roles
CREATE POLICY "Users can read their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert roles for themselves" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Note: We'll handle admin role management through edge functions instead of RLS
-- to avoid recursion issues

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('licenses', 'licenses', false),
  ('vehicles', 'vehicles', false),
  ('incidents', 'incidents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for licenses bucket
CREATE POLICY "Users can view their own licenses" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'licenses' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own licenses" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'licenses' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own licenses" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'licenses' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for vehicles bucket  
CREATE POLICY "Company members can view company vehicle files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'vehicles' AND 
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.company_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Company members can upload company vehicle files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'vehicles' AND 
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.company_id::text = (storage.foldername(name))[1]
  )
);

-- Storage policies for incidents bucket
CREATE POLICY "Users can view incident files they're involved in" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'incidents' AND 
  EXISTS (
    SELECT 1 FROM incidents i 
    JOIN bookings b ON i.booking_id = b.id 
    WHERE i.id::text = (storage.foldername(name))[1] 
    AND (b.client_id = auth.uid() OR EXISTS (
      SELECT 1 FROM assignments a 
      WHERE a.booking_id = b.id AND a.guard_id = auth.uid()
    ))
  )
);

CREATE POLICY "Users can upload incident files for their bookings" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'incidents' AND 
  EXISTS (
    SELECT 1 FROM incidents i 
    JOIN bookings b ON i.booking_id = b.id 
    WHERE i.id::text = (storage.foldername(name))[1] 
    AND (b.client_id = auth.uid() OR EXISTS (
      SELECT 1 FROM assignments a 
      WHERE a.booking_id = b.id AND a.guard_id = auth.uid()
    ))
  )
);

-- Create some default user roles to test the system
-- Insert a default client role for the test user
INSERT INTO public.user_roles (user_id, role) 
VALUES ('4ceda43a-cba9-413f-8a00-87e918a9060f', 'client'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;