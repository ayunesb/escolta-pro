-- Fix missing RLS policies for bookings insert
-- The error shows the function is trying to access assignments table but getting permission denied
-- Let's check what's missing and add proper policies

-- Enable RLS on tables that might be missing it
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Add INSERT policy for assignments (needed for auto-assignment triggers if any)
CREATE POLICY "System can create assignments" 
ON public.assignments 
FOR INSERT 
WITH CHECK (true);

-- Add INSERT policy for bookings to ensure authenticated users can create bookings
DROP POLICY IF EXISTS "bookings_client_insert" ON public.bookings;
CREATE POLICY "bookings_client_insert" 
ON public.bookings 
FOR INSERT 
WITH CHECK (client_id = auth.uid());

-- Verify profile exists for test user
SELECT id, email, first_name FROM profiles WHERE id = '4ceda43a-cba9-413f-8a00-87e918a9060f';