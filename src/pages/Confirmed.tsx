import { useMemo } from 'react';
import { useShipmentStore } from '@/store/shipmentStore';
import { PageHeader } from '@/components/ui/PageHeader';
import { ShipmentTable } from '@/components/tables/ShipmentTable';
import { toast } from 'sonner';
import { Shipment } from '@/types/shipment';

export default function Confirmed() {
  const allShipments = useShipmentStore((s) => s.shipments);
  const moveToStage = useShipmentStore((s) => s.moveToStage);

  const shipments = useMemo(
    () => allShipments.filter((ship) => ship.stage === 'confirmed'),
    [allShipments]
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
      />
      
      <ShipmentTable
        shipments={shipments}
        onMoveToNext={handleMoveToNext}
        showPricing
        nextStage="operations"
      />
    </div>
  );
}
