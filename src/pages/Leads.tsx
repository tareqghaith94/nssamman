import { useState } from 'react';
import { useShipmentStore } from '@/store/shipmentStore';
import { PageHeader } from '@/components/ui/PageHeader';
import { ShipmentTable } from '@/components/tables/ShipmentTable';
import { LeadForm } from '@/components/forms/LeadForm';
import { toast } from 'sonner';
import { Shipment } from '@/types/shipment';

export default function Leads() {
  const shipments = useShipmentStore((s) => s.getShipmentsByStage('lead'));
  const moveToStage = useShipmentStore((s) => s.moveToStage);
  
  const handleMoveToNext = (shipment: Shipment) => {
    moveToStage(shipment.id, 'pricing');
    toast.success(`${shipment.referenceId} moved to Pricing`);
  };
  
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Leads"
        description="Manage incoming shipment requests from the sales team"
        action={<LeadForm />}
      />
      
      <ShipmentTable
        shipments={shipments}
        onMoveToNext={handleMoveToNext}
        nextStage="pricing"
      />
    </div>
  );
}
