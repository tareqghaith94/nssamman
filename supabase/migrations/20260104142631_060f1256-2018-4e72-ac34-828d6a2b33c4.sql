-- Create shipments table
CREATE TABLE public.shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id text UNIQUE NOT NULL,
  salesperson text NOT NULL,
  port_of_loading text NOT NULL,
  port_of_discharge text NOT NULL,
  equipment jsonb NOT NULL DEFAULT '[]'::jsonb,
  mode_of_transport text NOT NULL DEFAULT 'sea',
  payment_terms text NOT NULL DEFAULT '30',
  incoterm text NOT NULL DEFAULT 'FOB',
  stage text NOT NULL DEFAULT 'lead',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  
  -- Pricing fields
  agent text,
  selling_price_per_unit numeric,
  cost_per_unit numeric,
  profit_per_unit numeric,
  total_selling_price numeric,
  total_cost numeric,
  total_profit numeric,
  
  -- Operations fields
  nss_booking_reference text,
  nss_invoice_number text,
  bl_type text,
  bl_draft_approval boolean DEFAULT false,
  final_bl_issued boolean DEFAULT false,
  terminal_cutoff timestamptz,
  gate_in_terminal timestamptz,
  etd timestamptz,
  eta timestamptz,
  arrival_notice_sent boolean DEFAULT false,
  do_issued boolean DEFAULT false,
  do_release_date timestamptz,
  total_invoice_amount numeric,
  completed_at timestamptz,
  ops_owner text,
  
  -- Payment tracking
  payment_collected boolean DEFAULT false,
  payment_collected_date timestamptz,
  agent_paid boolean DEFAULT false,
  agent_paid_date timestamptz,
  
  -- Agent invoice tracking
  agent_invoice_uploaded boolean DEFAULT false,
  agent_invoice_file_name text,
  agent_invoice_amount numeric,
  agent_invoice_date timestamptz,
  
  -- Lost shipment tracking
  is_lost boolean DEFAULT false,
  lost_reason text,
  lost_at timestamptz
);

-- Create activity_logs table
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid REFERENCES public.shipments(id) ON DELETE CASCADE,
  reference_id text,
  type text NOT NULL,
  description text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  user_name text,
  user_role text,
  timestamp timestamptz NOT NULL DEFAULT now(),
  field text,
  previous_value text,
  new_value text
);

-- Enable RLS
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user has any of specified roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  )
$$;

-- Create function to get user's ref_prefix for sales filtering
CREATE OR REPLACE FUNCTION public.get_user_ref_prefix(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ref_prefix FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Create function to check if user is sales-only (no other roles)
CREATE OR REPLACE FUNCTION public.is_sales_only(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'sales'
  ) AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role IN ('admin', 'pricing', 'ops', 'collections', 'finance')
  )
$$;

-- Shipments RLS Policies

-- Admin: Full access
CREATE POLICY "Admins have full access to shipments"
ON public.shipments FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Sales: View only their own shipments (by ref_prefix)
CREATE POLICY "Sales can view own shipments"
ON public.shipments FOR SELECT
USING (
  public.is_sales_only(auth.uid()) AND 
  reference_id LIKE (public.get_user_ref_prefix(auth.uid()) || '%')
);

-- Sales: Can insert new shipments
CREATE POLICY "Sales can insert shipments"
ON public.shipments FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'sales') AND
  created_by = auth.uid()
);

-- Non-admin, non-sales-only users: View all shipments
CREATE POLICY "Other roles can view all shipments"
ON public.shipments FOR SELECT
USING (
  public.has_any_role(auth.uid(), ARRAY['pricing', 'ops', 'collections', 'finance']::app_role[]) AND
  NOT public.is_sales_only(auth.uid())
);

-- Pricing role: Can update pricing fields when stage is pricing
CREATE POLICY "Pricing can update pricing fields"
ON public.shipments FOR UPDATE
USING (
  public.has_role(auth.uid(), 'pricing') AND stage = 'pricing'
);

-- Ops role: Can update operations fields
CREATE POLICY "Ops can update operations fields"
ON public.shipments FOR UPDATE
USING (
  public.has_role(auth.uid(), 'ops') AND stage IN ('confirmed', 'operations')
);

-- Collections role: Can update collection fields
CREATE POLICY "Collections can update collection fields"
ON public.shipments FOR UPDATE
USING (
  public.has_role(auth.uid(), 'collections') AND stage = 'completed'
);

-- Finance role: Can update payables fields
CREATE POLICY "Finance can update payables fields"
ON public.shipments FOR UPDATE
USING (
  public.has_role(auth.uid(), 'finance') AND stage IN ('operations', 'completed')
);

-- Activity Logs RLS Policies

-- Admin: Full access
CREATE POLICY "Admins have full access to activity logs"
ON public.activity_logs FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- All authenticated users can insert activity logs
CREATE POLICY "Authenticated users can insert activity logs"
ON public.activity_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Sales can view logs for their shipments only
CREATE POLICY "Sales can view own shipment logs"
ON public.activity_logs FOR SELECT
USING (
  public.is_sales_only(auth.uid()) AND
  reference_id LIKE (public.get_user_ref_prefix(auth.uid()) || '%')
);

-- Other roles can view all logs
CREATE POLICY "Other roles can view all logs"
ON public.activity_logs FOR SELECT
USING (
  public.has_any_role(auth.uid(), ARRAY['pricing', 'ops', 'collections', 'finance']::app_role[]) AND
  NOT public.is_sales_only(auth.uid())
);

-- Create function to generate reference IDs
CREATE OR REPLACE FUNCTION public.generate_reference_id(p_salesperson text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix text;
  v_count integer;
  v_year text;
  v_month text;
BEGIN
  -- Map salesperson to prefix
  v_prefix := CASE p_salesperson
    WHEN 'Amjad' THEN 'A'
    WHEN 'Tareq' THEN 'T'
    WHEN 'Mozayan' THEN 'M'
    WHEN 'Rania' THEN 'R'
    WHEN 'Sanad' THEN 'S'
    WHEN 'Uma' THEN 'U'
    WHEN 'Marwan' THEN 'MA'
    ELSE LEFT(p_salesperson, 1)
  END;
  
  v_year := TO_CHAR(NOW(), 'YY');
  v_month := TO_CHAR(NOW(), 'MM');
  
  -- Get count of existing shipments for this salesperson
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.shipments 
  WHERE salesperson = p_salesperson;
  
  RETURN v_prefix || '-' || v_year || v_month || '-' || LPAD(v_count::text, 4, '0');
END;
$$;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_shipments_updated_at
BEFORE UPDATE ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_shipments_stage ON public.shipments(stage);
CREATE INDEX idx_shipments_salesperson ON public.shipments(salesperson);
CREATE INDEX idx_shipments_reference_id ON public.shipments(reference_id);
CREATE INDEX idx_shipments_created_by ON public.shipments(created_by);
CREATE INDEX idx_activity_logs_shipment_id ON public.activity_logs(shipment_id);
CREATE INDEX idx_activity_logs_timestamp ON public.activity_logs(timestamp DESC);