-- Add RLS policy for Sales users to update their own leads
CREATE POLICY "Sales can update own leads"
ON public.shipments
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'sales'::app_role) 
  AND stage = 'lead' 
  AND created_by = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'sales'::app_role) 
  AND created_by = auth.uid()
);

-- Drop and recreate the Ops policy to remove 'confirmed' stage reference
DROP POLICY IF EXISTS "Ops can update operations fields" ON public.shipments;

CREATE POLICY "Ops can update operations fields"
ON public.shipments
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'ops'::app_role) 
  AND stage = ANY (ARRAY['pricing'::text, 'operations'::text])
);