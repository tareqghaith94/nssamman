
-- Create telesales_contacts table
CREATE TABLE public.telesales_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  company_name TEXT,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  industry TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  next_follow_up DATE,
  assigned_to TEXT,
  notes TEXT,
  converted_shipment_id UUID REFERENCES public.shipments(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create telesales_calls table
CREATE TABLE public.telesales_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.telesales_contacts(id) ON DELETE CASCADE,
  called_by UUID,
  call_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  outcome TEXT NOT NULL,
  duration_minutes INTEGER,
  notes TEXT,
  follow_up_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.telesales_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telesales_calls ENABLE ROW LEVEL SECURITY;

-- RLS for telesales_contacts: all authenticated can view
CREATE POLICY "Authenticated users can view telesales contacts"
  ON public.telesales_contacts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert telesales contacts"
  ON public.telesales_contacts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update telesales contacts"
  ON public.telesales_contacts FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete telesales contacts"
  ON public.telesales_contacts FOR DELETE
  TO authenticated
  USING (true);

-- RLS for telesales_calls: all authenticated can view and insert
CREATE POLICY "Authenticated users can view telesales calls"
  ON public.telesales_calls FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert telesales calls"
  ON public.telesales_calls FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update telesales calls"
  ON public.telesales_calls FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete telesales calls"
  ON public.telesales_calls FOR DELETE
  TO authenticated
  USING (true);

-- Updated_at trigger for contacts
CREATE TRIGGER update_telesales_contacts_updated_at
  BEFORE UPDATE ON public.telesales_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.telesales_contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.telesales_calls;
