-- Fix security issues by adding missing RLS policies (fixed syntax)

-- Add missing RLS policies for tables that don't have any
-- 1. audit_logs - only admins should access
CREATE POLICY "Only admins can access audit logs"
ON public.audit_logs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'company_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'company_admin'
  )
);

-- 2. booking_items - only related to user's bookings
CREATE POLICY "Users can access booking items for their bookings"
ON public.booking_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM bookings b 
    WHERE b.id = booking_items.booking_id 
    AND (
      b.client_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM assignments a 
        WHERE a.booking_id = b.id 
        AND a.guard_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings b 
    WHERE b.id = booking_items.booking_id 
    AND b.client_id = auth.uid()
  )
);

-- 3. incidents - only related users and admins
CREATE POLICY "Users can access related incidents"
ON public.incidents
FOR ALL
TO authenticated
USING (
  created_by = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM bookings b 
    WHERE b.id = incidents.booking_id 
    AND (
      b.client_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM assignments a 
        WHERE a.booking_id = b.id 
        AND a.guard_id = auth.uid()
      )
    )
  )
  OR EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'company_admin'
  )
)
WITH CHECK (
  created_by = auth.uid()
);

-- 4. licenses - only guard owners and company admins
CREATE POLICY "Guards and company admins can manage licenses"
ON public.licenses
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM guards g 
    WHERE g.id = licenses.guard_id 
    AND (
      g.user_id = auth.uid() 
      OR g.company_id = (
        SELECT p.company_id FROM profiles p 
        WHERE p.id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM guards g 
    WHERE g.id = licenses.guard_id 
    AND (
      g.user_id = auth.uid() 
      OR g.company_id = (
        SELECT p.company_id FROM profiles p 
        WHERE p.id = auth.uid()
      )
    )
  )
);

-- 5. payments - only related users and admins
CREATE POLICY "Users can access related payments"
ON public.payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM bookings b 
    WHERE b.id = payments.booking_id 
    AND (
      b.client_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM assignments a 
        WHERE a.booking_id = b.id 
        AND a.guard_id = auth.uid()
      )
    )
  )
  OR EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'company_admin'
  )
);

-- 6. payouts - only guard owners and company admins
CREATE POLICY "Guards and admins can access payouts"
ON public.payouts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM guards g 
    WHERE g.id = payouts.guard_id 
    AND (
      g.user_id = auth.uid() 
      OR g.company_id = (
        SELECT p.company_id FROM profiles p 
        WHERE p.id = auth.uid()
      )
    )
  )
  OR EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'company_admin'
  )
);

-- 7. pricing_rules - public read, admin write
CREATE POLICY "Everyone can read pricing rules"
ON public.pricing_rules
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can modify pricing rules"
ON public.pricing_rules
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'company_admin'
  )
);

CREATE POLICY "Only admins can update pricing rules"
ON public.pricing_rules
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'company_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'company_admin'
  )
);

CREATE POLICY "Only admins can delete pricing rules"
ON public.pricing_rules
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'company_admin'
  )
);

-- 8. quotes - only related users
CREATE POLICY "Users can access related quotes"
ON public.quotes
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM bookings b 
    WHERE b.id::text = quotes.booking_id 
    AND (
      b.client_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM assignments a 
        WHERE a.booking_id = b.id 
        AND a.guard_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings b 
    WHERE b.id::text = quotes.booking_id 
    AND b.client_id = auth.uid()
  )
);

-- Fix the has_role function to have proper search path
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;