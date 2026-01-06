-- Create table for per-salesperson commission rules
CREATE TABLE public.salesperson_commission_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salesperson TEXT NOT NULL UNIQUE,
  formula_type TEXT NOT NULL DEFAULT 'flat_percentage' CHECK (formula_type IN ('flat_percentage', 'gp_minus_salary', 'tiered')),
  config JSONB NOT NULL DEFAULT '{"percentage": 5}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Enable RLS
ALTER TABLE public.salesperson_commission_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view commission rules"
ON public.salesperson_commission_rules
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert commission rules"
ON public.salesperson_commission_rules
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update commission rules"
ON public.salesperson_commission_rules
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete commission rules"
ON public.salesperson_commission_rules
FOR DELETE
USING (is_admin(auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_commission_rules_updated_at
BEFORE UPDATE ON public.salesperson_commission_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();