-- Drop and recreate the Pricing update policy with proper WITH CHECK clause
DROP POLICY IF EXISTS "Pricing can update pricing fields" ON public.shipments;

CREATE POLICY "Pricing can update pricing fields"
ON public.shipments
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'pricing'::app_role) 
  AND stage = 'pricing'
)
WITH CHECK (
  has_role(auth.uid(), 'pricing'::app_role)
);