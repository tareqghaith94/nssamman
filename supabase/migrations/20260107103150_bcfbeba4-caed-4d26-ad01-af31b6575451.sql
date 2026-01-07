-- Add currency column to shipments table
ALTER TABLE public.shipments 
ADD COLUMN currency text NOT NULL DEFAULT 'USD';

-- Add comment for documentation
COMMENT ON COLUMN public.shipments.currency IS 'Currency for all monetary values in this shipment (USD, EUR, JOD)';