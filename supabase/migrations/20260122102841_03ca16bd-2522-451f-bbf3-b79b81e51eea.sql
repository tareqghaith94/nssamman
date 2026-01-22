-- Function to auto-create agent payable when ETD/ETA is set
CREATE OR REPLACE FUNCTION public.create_agent_payable_on_schedule()
RETURNS TRIGGER AS $$
DECLARE
  existing_count INTEGER;
  is_export BOOLEAN;
  calculated_due_date TIMESTAMPTZ;
BEGIN
  -- Check if we have an agent and ETD or ETA is now set
  IF (NEW.agent IS NOT NULL AND NEW.agent != '') AND 
     (NEW.etd IS NOT NULL OR NEW.eta IS NOT NULL) THEN
    
    -- For INSERT: always check. For UPDATE: only if ETD/ETA changed from NULL
    IF TG_OP = 'INSERT' OR 
       (TG_OP = 'UPDATE' AND 
        ((OLD.etd IS NULL AND NEW.etd IS NOT NULL) OR 
         (OLD.eta IS NULL AND NEW.eta IS NOT NULL))) THEN
      
      -- Check if agent payable already exists
      SELECT COUNT(*) INTO existing_count
      FROM public.shipment_payables
      WHERE shipment_id = NEW.id 
        AND party_type = 'agent';
      
      IF existing_count = 0 THEN
        -- Determine if export (Aqaba) or import
        is_export := LOWER(NEW.port_of_loading) LIKE '%aqaba%';
        
        -- Calculate due date: ETD+3 for exports, ETA-10 for imports
        IF is_export AND NEW.etd IS NOT NULL THEN
          calculated_due_date := NEW.etd + INTERVAL '3 days';
        ELSIF NEW.eta IS NOT NULL THEN
          calculated_due_date := NEW.eta - INTERVAL '10 days';
        ELSE
          calculated_due_date := NULL;
        END IF;
        
        -- Insert the agent payable
        INSERT INTO public.shipment_payables (
          shipment_id, party_type, party_name, 
          estimated_amount, currency, due_date
        ) VALUES (
          NEW.id, 'agent', NEW.agent,
          NEW.total_cost, NEW.currency, calculated_due_date
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for UPDATE (when ETD/ETA is added)
CREATE TRIGGER trigger_create_agent_payable_on_update
AFTER UPDATE OF etd, eta ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.create_agent_payable_on_schedule();

-- Trigger for INSERT (if shipment created with ETD/ETA already set)
CREATE TRIGGER trigger_create_agent_payable_on_insert
AFTER INSERT ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.create_agent_payable_on_schedule();

-- Backfill: Create agent payables for existing shipments missing them
INSERT INTO public.shipment_payables (
  shipment_id, party_type, party_name, 
  estimated_amount, currency, due_date
)
SELECT 
  s.id,
  'agent',
  s.agent,
  s.total_cost,
  s.currency,
  CASE 
    WHEN LOWER(s.port_of_loading) LIKE '%aqaba%' AND s.etd IS NOT NULL 
      THEN s.etd + INTERVAL '3 days'
    WHEN s.eta IS NOT NULL 
      THEN s.eta - INTERVAL '10 days'
    ELSE NULL
  END
FROM public.shipments s
WHERE s.agent IS NOT NULL AND s.agent != ''
  AND (s.etd IS NOT NULL OR s.eta IS NOT NULL)
  AND NOT EXISTS (
    SELECT 1 FROM public.shipment_payables sp 
    WHERE sp.shipment_id = s.id AND sp.party_type = 'agent'
  );