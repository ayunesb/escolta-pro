-- Add booking assignment columns
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS assigned_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_company_id uuid REFERENCES companies(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings(status);
CREATE INDEX IF NOT EXISTS bookings_assigned_user_idx ON bookings(assigned_user_id);
CREATE INDEX IF NOT EXISTS bookings_assigned_company_idx ON bookings(assigned_company_id);

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "guards_read_matching_and_own" ON bookings;
DROP POLICY IF EXISTS "guards_update_own_assigned" ON bookings;
DROP POLICY IF EXISTS "company_read_update" ON bookings;

-- Freelancers (guards) can read 'available' (matching) + their own assigned bookings
CREATE POLICY "guards_read_matching_and_own"
ON bookings FOR SELECT TO authenticated
USING (
  status IN ('matching','assigned')
  AND (
    status = 'matching' -- available to everyone qualified
    OR assigned_user_id = auth.uid()
  )
);

-- Freelancers can update ONLY their own assigned bookings
CREATE POLICY "guards_update_own_assigned"
ON bookings FOR UPDATE TO authenticated
USING (assigned_user_id = auth.uid());

-- Company admins can read/update bookings for their company
CREATE POLICY "company_read_update"
ON bookings FOR ALL TO authenticated
USING (assigned_company_id = (
  SELECT company_id FROM profiles WHERE id = auth.uid()
))
WITH CHECK (assigned_company_id = (
  SELECT company_id FROM profiles WHERE id = auth.uid()
));