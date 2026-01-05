-- Create app_settings table for admin-configurable settings
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read settings
CREATE POLICY "Authenticated users can read settings"
ON public.app_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only admins can update settings
CREATE POLICY "Admins can update settings"
ON public.app_settings
FOR UPDATE
USING (is_admin(auth.uid()));

-- Only admins can insert settings
CREATE POLICY "Admins can insert settings"
ON public.app_settings
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Insert default commission rate
INSERT INTO public.app_settings (key, value) 
VALUES ('commission_rate', '{"percentage": 4, "description": "Commission percentage of Gross Profit"}');