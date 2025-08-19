-- Helper function to check if current user (guard) is assigned to a booking
CREATE OR REPLACE FUNCTION public.is_guard_assigned_to_booking(_booking_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.assignments a
    WHERE a.booking_id = _booking_id
      AND a.guard_id = auth.uid()
  );
$$;

-- Remove the SELECT policy that referenced assignments directly (causing permission errors)
DROP POLICY IF EXISTS "bookings_client_read" ON public.bookings;

-- Guards can read bookings they are assigned to (without directly referencing assignments in the policy)
CREATE POLICY "bookings_guard_select_assigned"
ON public.bookings
FOR SELECT
USING (public.is_guard_assigned_to_booking(id));