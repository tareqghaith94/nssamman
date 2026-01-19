-- Add special remarks, DG flag, and UN number columns to shipments table
ALTER TABLE public.shipments 
  ADD COLUMN special_remarks text DEFAULT NULL,
  ADD COLUMN is_dg boolean DEFAULT false,
  ADD COLUMN un_number text DEFAULT NULL;