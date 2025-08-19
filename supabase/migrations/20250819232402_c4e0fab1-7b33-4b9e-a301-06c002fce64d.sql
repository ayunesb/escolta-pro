-- Allow clients to see basic guard information for booking purposes
-- This policy allows anyone to see guards that are active (for discovery/booking)
CREATE POLICY "Active guards are publicly visible for booking"
ON public.guards
FOR SELECT
USING (active = true);

-- The existing policies for owner/company admin access remain
-- guards readable by owner or company admin - keeps existing functionality
-- guards update by company admin - keeps existing functionality  
-- guards write by company admin - keeps existing functionality