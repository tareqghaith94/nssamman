-- Create shipment_payables table for tracking multiple payable parties per shipment
CREATE TABLE public.shipment_payables (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  party_type text NOT NULL DEFAULT 'agent',
  party_name text NOT NULL,
  estimated_amount numeric,
  invoice_amount numeric,
  invoice_file_name text,
  invoice_uploaded boolean DEFAULT false,
  invoice_date timestamptz,
  paid boolean DEFAULT false,
  paid_date timestamptz,
  currency text NOT NULL DEFAULT 'USD',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add constraint for party_type values
ALTER TABLE public.shipment_payables 
ADD CONSTRAINT shipment_payables_party_type_check 
CHECK (party_type IN ('agent', 'shipping_line', 'land_transport', 'customs_broker', 'other'));

-- Enable Row Level Security
ALTER TABLE public.shipment_payables ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (matching existing permissive pattern)
CREATE POLICY "Authenticated users have full access to shipment_payables"
ON public.shipment_payables
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups by shipment
CREATE INDEX idx_shipment_payables_shipment_id ON public.shipment_payables(shipment_id);

-- Create index for filtering unpaid payables
CREATE INDEX idx_shipment_payables_paid ON public.shipment_payables(paid);

-- Create trigger for updated_at
CREATE TRIGGER update_shipment_payables_updated_at
BEFORE UPDATE ON public.shipment_payables
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing agent payables from shipments table to new table
INSERT INTO public.shipment_payables (
  shipment_id,
  party_type,
  party_name,
  estimated_amount,
  invoice_amount,
  invoice_file_name,
  invoice_uploaded,
  invoice_date,
  paid,
  paid_date,
  currency
)
SELECT 
  id,
  'agent',
  agent,
  total_cost,
  agent_invoice_amount,
  agent_invoice_file_name,
  COALESCE(agent_invoice_uploaded, false),
  agent_invoice_date,
  COALESCE(agent_paid, false),
  agent_paid_date,
  currency
FROM public.shipments
WHERE agent IS NOT NULL AND agent != ''
  AND (etd IS NOT NULL OR eta IS NOT NULL);