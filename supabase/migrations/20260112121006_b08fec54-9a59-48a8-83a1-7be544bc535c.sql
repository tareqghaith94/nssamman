-- Add optional custom due_date field to shipment_payables
ALTER TABLE public.shipment_payables
ADD COLUMN due_date timestamp with time zone DEFAULT NULL;