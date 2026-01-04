import { useMemo, useState } from 'react';
import { useShipmentStore } from '@/store/shipmentStore';
import { PageHeader } from '@/components/ui/PageHeader';
import { ShipmentTable } from '@/components/tables/ShipmentTable';
import { StageFilter } from '@/components/ui/StageFilter';
import { toast } from 'sonner';
import { Shipment } from '@/types/shipment';
import { hasReachedStage } from '@/lib/stageOrder';

export default function Confirmed() {
  const allShipments = useShipmentStore((s) => s.shipments);
  const moveToStage = useShipmentStore((s) => s.moveToStage);
  const [showHistory, setShowHistory] = useState(false);

  const shipments = useMemo(
    () => showHistory
      ? allShipments.filter((ship) => hasReachedStage(ship.stage, 'confirmed'))
      : allShipments.filter((ship) => ship.stage === 'confirmed'),
    [allShipments, showHistory]
  );
  
  const handleMoveToNext = (shipment: Shipment) => {
    moveToStage(shipment.id, 'operations');
    toast.success(`${shipment.referenceId} moved to Operations`);
  };
  
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Confirmed Shipments"
        description="Client-approved quotes ready for operations"
        action={<StageFilter showHistory={showHistory} onToggle={setShowHistory} />}
      />
      
      <ShipmentTable
        shipments={shipments}
        onMoveToNext={showHistory ? undefined : handleMoveToNext}
        showPricing
        nextStage="operations"
      />
    </div>
  );
}
