-- Add pricing_owner column to shipments table
ALTER TABLE public.shipments 
ADD COLUMN pricing_owner text NULL;