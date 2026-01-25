-- Add cost_currency column to track the primary currency used for costs
ALTER TABLE shipments ADD COLUMN cost_currency TEXT DEFAULT 'USD';