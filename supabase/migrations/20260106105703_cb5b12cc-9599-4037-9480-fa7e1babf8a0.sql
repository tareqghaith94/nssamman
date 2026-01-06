-- Create cost_line_items table for detailed cost breakdown
CREATE TABLE public.cost_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  equipment_type TEXT,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  amount NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cost_line_items ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Authenticated users have full access to cost line items"
ON public.cost_line_items
FOR ALL
USING (true)
WITH CHECK (true);