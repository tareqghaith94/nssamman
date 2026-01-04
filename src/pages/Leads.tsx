import { useMemo, useState } from 'react';
import { useShipmentStore } from '@/store/shipmentStore';
import { PageHeader } from '@/components/ui/PageHeader';
import { ShipmentTable } from '@/components/tables/ShipmentTable';
import { LeadForm } from '@/components/forms/LeadForm';
import { StageFilter } from '@/components/ui/StageFilter';
import { toast } from 'sonner';
import { Shipment } from '@/types/shipment';
import { hasReachedStage } from '@/lib/stageOrder';

export default function Leads() {
  const allShipments = useShipmentStore((s) => s.shipments);
  const moveToStage = useShipmentStore((s) => s.moveToStage);
  const [showHistory, setShowHistory] = useState(false);

  const shipments = useMemo(
    () => showHistory
      ? allShipments.filter((ship) => hasReachedStage(ship.stage, 'lead'))
      : allShipments.filter((ship) => ship.stage === 'lead'),
    [allShipments, showHistory]
  );
  
  const handleMoveToNext = (shipment: Shipment) => {
    moveToStage(shipment.id, 'pricing');
    toast.success(`${shipment.referenceId} moved to Pricing`);
  };
  
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Leads"
        description="Manage incoming shipment requests from the sales team"
        action={
          <div className="flex items-center gap-3">
            <StageFilter showHistory={showHistory} onToggle={setShowHistory} />
            <LeadForm />
          </div>
        }
      />
      
      <ShipmentTable
        shipments={shipments}
        onMoveToNext={showHistory ? undefined : handleMoveToNext}
        nextStage="pricing"
      />
    </div>
  );
}
