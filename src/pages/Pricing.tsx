import { useState } from 'react';
import { useShipmentStore } from '@/store/shipmentStore';
import { PageHeader } from '@/components/ui/PageHeader';
import { ShipmentTable } from '@/components/tables/ShipmentTable';
import { PricingForm } from '@/components/forms/PricingForm';
import { Shipment } from '@/types/shipment';

export default function Pricing() {
  const shipments = useShipmentStore((s) => s.getShipmentsByStage('pricing'));
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  
  const handleEdit = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setFormOpen(true);
  };
  
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Pricing"
        description="Process quotation requests and assign agents"
      />
      
      <ShipmentTable
        shipments={shipments}
        onEdit={handleEdit}
        showPricing
      />
      
      <PricingForm
        shipment={selectedShipment}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </div>
  );
}
