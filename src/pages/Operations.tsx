import { useState } from 'react';
import { useShipmentStore } from '@/store/shipmentStore';
import { PageHeader } from '@/components/ui/PageHeader';
import { ShipmentTable } from '@/components/tables/ShipmentTable';
import { OperationsForm } from '@/components/forms/OperationsForm';
import { Shipment } from '@/types/shipment';

export default function Operations() {
  const shipments = useShipmentStore((s) => s.shipments.filter((ship) => ship.stage === 'operations'));
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  
  const handleEdit = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setFormOpen(true);
  };
  
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Operations"
        description="Track shipments through the logistics process"
      />
      
      <ShipmentTable
        shipments={shipments}
        onEdit={handleEdit}
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
