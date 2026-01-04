import { useMemo, useState } from 'react';
import { useFilteredShipments } from '@/hooks/useFilteredShipments';
import { useShipmentStore } from '@/store/shipmentStore';
import { useAuth } from '@/hooks/useAuth';
import { canAdvanceStage } from '@/lib/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { ShipmentTable } from '@/components/tables/ShipmentTable';
import { StageFilter } from '@/components/ui/StageFilter';
import { toast } from 'sonner';
import { Shipment } from '@/types/shipment';
import { hasReachedStage } from '@/lib/stageOrder';
import { UserRole } from '@/types/permissions';

export default function Confirmed() {
  const allShipments = useFilteredShipments();
  const moveToStage = useShipmentStore((s) => s.moveToStage);
  const { roles } = useAuth();
  const [showHistory, setShowHistory] = useState(false);

  // Use roles from auth for multi-role support
  const userRoles = (roles || []) as UserRole[];

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
  
  // Only show move button if user can advance from confirmed stage
  const canAdvance = canAdvanceStage(userRoles, 'confirmed');
  
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Confirmed Shipments"
        description="Client-approved quotes ready for operations"
        action={<StageFilter showHistory={showHistory} onToggle={setShowHistory} />}
      />
      
      <ShipmentTable
        shipments={shipments}
        onMoveToNext={!showHistory && canAdvance ? handleMoveToNext : undefined}
        showPricing
        nextStage="operations"
      />
    </div>
  );
}
