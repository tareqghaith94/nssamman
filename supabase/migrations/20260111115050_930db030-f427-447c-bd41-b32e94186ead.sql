-- Add invoice_currency column to shipments for multi-currency invoice amounts
ALTER TABLE public.shipments 
ADD COLUMN invoice_currency text NOT NULL DEFAULT 'USD';

-- Add invoice_file_path column to shipment_payables for storing uploaded file paths
ALTER TABLE public.shipment_payables
ADD COLUMN invoice_file_path text;

-- Create storage bucket for payable invoices
INSERT INTO storage.buckets (id, name, public)
VALUES ('payable-invoices', 'payable-invoices', false);

-- RLS policy for authenticated users to upload payable invoices
CREATE POLICY "Authenticated users can upload payable invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payable-invoices');

-- RLS policy for authenticated users to view payable invoices
CREATE POLICY "Authenticated users can view payable invoices"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'payable-invoices');

-- RLS policy for authenticated users to delete payable invoices
CREATE POLICY "Authenticated users can delete payable invoices"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'payable-invoices');