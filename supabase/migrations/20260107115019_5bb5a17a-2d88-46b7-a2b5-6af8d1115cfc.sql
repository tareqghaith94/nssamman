-- Create collection_payments table for tracking partial payments
CREATE TABLE public.collection_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Add amount_collected to shipments for tracking running total
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS amount_collected NUMERIC DEFAULT 0;

-- Enable RLS
ALTER TABLE public.collection_payments ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Authenticated users have full access to collection_payments"
ON public.collection_payments
FOR ALL
USING (true)
WITH CHECK (true);