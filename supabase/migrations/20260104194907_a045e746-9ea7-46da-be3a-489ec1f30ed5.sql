-- Create quotations table
CREATE TABLE public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number TEXT NOT NULL UNIQUE,
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_address TEXT,
  pol TEXT NOT NULL,
  pod TEXT NOT NULL,
  mode_of_transport TEXT NOT NULL DEFAULT 'sea',
  equipment JSONB NOT NULL DEFAULT '[]'::jsonb,
  ocean_freight_amount NUMERIC,
  exw_amount NUMERIC,
  exw_qty INTEGER,
  remarks TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  issued_at TIMESTAMP WITH TIME ZONE
);

-- Create quote_line_items table
CREATE TABLE public.quote_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  equipment_type TEXT,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  amount NUMERIC GENERATED ALWAYS AS (unit_cost * quantity) STORED
);

-- Create sequence for quote numbering
CREATE SEQUENCE public.quote_number_seq START WITH 1;

-- Create function to generate quote number
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_num INTEGER;
BEGIN
  v_num := nextval('quote_number_seq');
  RETURN 'Q-' || LPAD(v_num::text, 4, '0');
END;
$$;

-- Enable RLS
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_line_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for quotations
CREATE POLICY "Admins have full access to quotations"
ON public.quotations
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Pricing can manage quotations"
ON public.quotations
FOR ALL
USING (has_role(auth.uid(), 'pricing'))
WITH CHECK (has_role(auth.uid(), 'pricing'));

CREATE POLICY "Other roles can view quotations"
ON public.quotations
FOR SELECT
USING (has_any_role(auth.uid(), ARRAY['ops'::app_role, 'collections'::app_role, 'finance'::app_role]));

CREATE POLICY "Sales can view own quotations"
ON public.quotations
FOR SELECT
USING (
  is_sales_only(auth.uid()) 
  AND shipment_id IN (
    SELECT id FROM public.shipments 
    WHERE reference_id LIKE (get_user_ref_prefix(auth.uid()) || '%')
  )
);

-- RLS policies for quote_line_items
CREATE POLICY "Admins have full access to line items"
ON public.quote_line_items
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Pricing can manage line items"
ON public.quote_line_items
FOR ALL
USING (has_role(auth.uid(), 'pricing'))
WITH CHECK (has_role(auth.uid(), 'pricing'));

CREATE POLICY "Other roles can view line items"
ON public.quote_line_items
FOR SELECT
USING (has_any_role(auth.uid(), ARRAY['ops'::app_role, 'collections'::app_role, 'finance'::app_role, 'sales'::app_role]));