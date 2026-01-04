import { useMemo, useState } from 'react';
import { useFilteredShipments } from '@/hooks/useFilteredShipments';
import { useShipmentStore } from '@/store/shipmentStore';
import { useUserStore } from '@/store/userStore';
import { canAdvanceStage } from '@/lib/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { ShipmentTable } from '@/components/tables/ShipmentTable';
import { LeadForm } from '@/components/forms/LeadForm';
import { StageFilter } from '@/components/ui/StageFilter';
import { toast } from 'sonner';
import { Shipment } from '@/types/shipment';
import { hasReachedStage } from '@/lib/stageOrder';
import { UserRole } from '@/types/permissions';

export default function Leads() {
  const allShipments = useFilteredShipments();
  const moveToStage = useShipmentStore((s) => s.moveToStage);
  const currentUser = useUserStore((s) => s.currentUser);
  const [showHistory, setShowHistory] = useState(false);

  // Use roles array for multi-role support
  const userRoles = (currentUser.roles || [currentUser.role]) as UserRole[];

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
  
  // Only show move button if user can advance from lead stage
  const canAdvance = canAdvanceStage(userRoles, 'lead');
  
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
        onMoveToNext={!showHistory && canAdvance ? handleMoveToNext : undefined}
        nextStage="pricing"
      />
    </div>
  );
}
