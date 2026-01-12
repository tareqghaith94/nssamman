-- Add currency column to quotations table for multi-currency support
ALTER TABLE quotations
ADD COLUMN currency text NOT NULL DEFAULT 'USD';