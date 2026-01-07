-- Add currency column to quote_line_items table
ALTER TABLE public.quote_line_items 
ADD COLUMN currency text NOT NULL DEFAULT 'USD';

-- Add currency column to cost_line_items table
ALTER TABLE public.cost_line_items 
ADD COLUMN currency text NOT NULL DEFAULT 'USD';