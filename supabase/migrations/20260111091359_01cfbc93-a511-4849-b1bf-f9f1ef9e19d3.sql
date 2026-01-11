-- Fix: Drop generated column, alter type, recreate generated column

-- For cost_line_items
ALTER TABLE cost_line_items DROP COLUMN amount;
ALTER TABLE cost_line_items ALTER COLUMN quantity TYPE NUMERIC(10,2);
ALTER TABLE cost_line_items ADD COLUMN amount NUMERIC(12,2) GENERATED ALWAYS AS (unit_cost * quantity) STORED;

-- For quote_line_items
ALTER TABLE quote_line_items DROP COLUMN amount;
ALTER TABLE quote_line_items ALTER COLUMN quantity TYPE NUMERIC(10,2);
ALTER TABLE quote_line_items ADD COLUMN amount NUMERIC(12,2) GENERATED ALWAYS AS (unit_cost * quantity) STORED;