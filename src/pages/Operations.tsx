import { useMemo, useState } from 'react';
import { useShipmentStore } from '@/store/shipmentStore';
import { PageHeader } from '@/components/ui/PageHeader';
import { ShipmentTable } from '@/components/tables/ShipmentTable';
import { OperationsForm } from '@/components/forms/OperationsForm';
import { StageFilter } from '@/components/ui/StageFilter';
import { Shipment } from '@/types/shipment';
import { hasReachedStage } from '@/lib/stageOrder';

export default function Operations() {
  const allShipments = useShipmentStore((s) => s.shipments);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const shipments = useMemo(
    () => showHistory
      ? allShipments.filter((ship) => hasReachedStage(ship.stage, 'operations'))
      : allShipments.filter((ship) => ship.stage === 'operations'),
    [allShipments, showHistory]
  );
  
  const handleEdit = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setFormOpen(true);
  };
  
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Operations"
        description="Track shipments through the logistics process"
        action={<StageFilter showHistory={showHistory} onToggle={setShowHistory} />}
      />
      
      <ShipmentTable
        shipments={shipments}
        onEdit={showHistory ? undefined : handleEdit}
        showOperations
        showPricing
      />
      
      <OperationsForm
        shipment={selectedShipment}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </div>
  );
}
