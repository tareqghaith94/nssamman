-- Clean up orphaned quotations (no shipment link)
DELETE FROM public.quote_line_items 
WHERE quotation_id IN (SELECT id FROM public.quotations WHERE shipment_id IS NULL);

DELETE FROM public.quotations WHERE shipment_id IS NULL;

-- Drop the quote_number column (we use shipment's reference_id instead)
ALTER TABLE public.quotations DROP COLUMN IF EXISTS quote_number;

-- Drop the sequence that was used for quote numbers
DROP SEQUENCE IF EXISTS public.quote_number_seq;

-- Drop the function that generated quote numbers
DROP FUNCTION IF EXISTS public.generate_quote_number();

-- Make shipment_id NOT NULL (quotations must be linked to a shipment)
ALTER TABLE public.quotations ALTER COLUMN shipment_id SET NOT NULL;