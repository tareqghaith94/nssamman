-- =====================================================
-- PART 1: RESET ALL RLS POLICIES TO PERMISSIVE
-- =====================================================

-- SHIPMENTS: Drop all 9 existing policies
DROP POLICY IF EXISTS "Admins have full access to shipments" ON public.shipments;
DROP POLICY IF EXISTS "Collections can update collection fields" ON public.shipments;
DROP POLICY IF EXISTS "Finance can update payables fields" ON public.shipments;
DROP POLICY IF EXISTS "Ops can update operations fields" ON public.shipments;
DROP POLICY IF EXISTS "Other roles can view all shipments" ON public.shipments;
DROP POLICY IF EXISTS "Pricing can update pricing fields" ON public.shipments;
DROP POLICY IF EXISTS "Sales can insert shipments" ON public.shipments;
DROP POLICY IF EXISTS "Sales can update own leads" ON public.shipments;
DROP POLICY IF EXISTS "Sales can view own shipments" ON public.shipments;

-- Create single permissive policy for shipments
CREATE POLICY "Authenticated users have full access"
ON public.shipments
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ACTIVITY_LOGS: Drop all 4 existing policies
DROP POLICY IF EXISTS "Admins have full access to activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Authenticated users can insert activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Other roles can view all logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Sales can view own shipment logs" ON public.activity_logs;

-- Create single permissive policy for activity_logs
CREATE POLICY "Authenticated users have full access to activity logs"
ON public.activity_logs
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- QUOTATIONS: Drop all 4 existing policies
DROP POLICY IF EXISTS "Admins have full access to quotations" ON public.quotations;
DROP POLICY IF EXISTS "Other roles can view quotations" ON public.quotations;
DROP POLICY IF EXISTS "Pricing can manage quotations" ON public.quotations;
DROP POLICY IF EXISTS "Sales can view own quotations" ON public.quotations;

-- Create single permissive policy for quotations
CREATE POLICY "Authenticated users have full access to quotations"
ON public.quotations
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- QUOTE_LINE_ITEMS: Drop all 3 existing policies
DROP POLICY IF EXISTS "Admins have full access to line items" ON public.quote_line_items;
DROP POLICY IF EXISTS "Other roles can view line items" ON public.quote_line_items;
DROP POLICY IF EXISTS "Pricing can manage line items" ON public.quote_line_items;

-- Create single permissive policy for quote_line_items
CREATE POLICY "Authenticated users have full access to line items"
ON public.quote_line_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- PART 2: MIGRATE LEGACY DATA
-- =====================================================

-- Move any shipments stuck in 'confirmed' stage to 'operations'
UPDATE public.shipments 
SET stage = 'operations' 
WHERE stage = 'confirmed';

-- =====================================================
-- PART 3: CREATE NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE,
  reference_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Any authenticated user can insert notifications (for system to create)
CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- =====================================================
-- PART 4: ADD CLIENT NAME TO SHIPMENTS (for quotations)
-- =====================================================

ALTER TABLE public.shipments 
ADD COLUMN IF NOT EXISTS client_name TEXT;