-- Secure RLS for assignments to prevent data exposure
-- 1) Ensure RLS is enabled
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- 2) Remove overly permissive INSERT policy if it exists
DROP POLICY IF EXISTS "System can create assignments" ON public.assignments;

-- 3) Explicitly deny INSERTs for anon/authenticated (service role bypasses RLS)
CREATE POLICY "assignments_insert_denied"
ON public.assignments
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

-- 4) Keep existing guard SELECT policy if present; otherwise (idempotent re-create)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'assignments'
      AND policyname = 'assignments_guard_select'
  ) THEN
    CREATE POLICY "assignments_guard_select"
    ON public.assignments
    FOR SELECT
    TO authenticated
    USING (guard_id = auth.uid());
  END IF;
END$$;

-- 5) Allow clients to view assignments only for their own bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'assignments'
      AND policyname = 'assignments_client_select'
  ) THEN
    CREATE POLICY "assignments_client_select"
    ON public.assignments
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.id = assignments.booking_id
          AND b.client_id = auth.uid()
      )
    );
  END IF;
END$$;

-- 6) Allow company admins to view assignments for their company’s guards or bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'assignments'
      AND policyname = 'assignments_company_admin_select'
  ) THEN
    CREATE POLICY "assignments_company_admin_select"
    ON public.assignments
    FOR SELECT
    TO authenticated
    USING (
      has_role(auth.uid(), 'company_admin') AND (
        EXISTS (
          SELECT 1 FROM public.guards g
          WHERE g.id = assignments.guard_id
            AND g.company_id = (
              SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
            )
        ) OR EXISTS (
          SELECT 1 FROM public.bookings b
          WHERE b.id = assignments.booking_id
            AND b.assigned_company_id = (
              SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
            )
        )
      )
    );
  END IF;
END$$;