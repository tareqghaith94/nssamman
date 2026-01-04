import { useMemo, useState } from 'react';
import { useFilteredShipments } from '@/hooks/useFilteredShipments';
import { useShipments } from '@/hooks/useShipments';
import { useAuth } from '@/hooks/useAuth';
import { useTrackedShipmentActions } from '@/hooks/useTrackedShipmentActions';
import { canAdvanceStage, canRevertStage, getPreviousStage } from '@/lib/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { ShipmentTable } from '@/components/tables/ShipmentTable';
import { RevertConfirmDialog } from '@/components/dialogs/RevertConfirmDialog';
import { StageFilter } from '@/components/ui/StageFilter';
import { toast } from 'sonner';
import { Shipment } from '@/types/shipment';
import { hasReachedStage } from '@/lib/stageOrder';
import { UserRole } from '@/types/permissions';

export default function Confirmed() {
  const { shipments: allShipments, isLoading } = useFilteredShipments();
  const { moveToStage } = useShipments();
  const { roles } = useAuth();
  const { trackRevertStage } = useTrackedShipmentActions();
  const [showHistory, setShowHistory] = useState(false);
  const [revertShipment, setRevertShipment] = useState<Shipment | null>(null);

  // Use roles from auth for multi-role support
  const userRoles = (roles || []) as UserRole[];

  const shipments = useMemo(
    () => showHistory
      ? allShipments.filter((ship) => hasReachedStage(ship.stage, 'confirmed'))
      : allShipments.filter((ship) => ship.stage === 'confirmed'),
    [allShipments, showHistory]
  );
  
  const handleMoveToNext = async (shipment: Shipment) => {
    await moveToStage(shipment.id, 'operations');
    toast.success(`${shipment.referenceId} moved to Operations`);
  };
  
  const handleRevert = async (shipment: Shipment) => {
    const previousStage = getPreviousStage(shipment.stage);
    if (!previousStage) return;
    
    await trackRevertStage(shipment, previousStage);
    toast.success(`${shipment.referenceId} reverted to ${previousStage}`);
    setRevertShipment(null);
  };
  
  // Only show move button if user can advance from confirmed stage
  const canAdvance = canAdvanceStage(userRoles, 'confirmed');
  const canRevert = canRevertStage(userRoles, 'confirmed');
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
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
        onRevert={!showHistory && canRevert ? (ship) => setRevertShipment(ship) : undefined}
        showPricing
        nextStage="operations"
      />
      
      {revertShipment && (
        <RevertConfirmDialog
          open={!!revertShipment}
          onOpenChange={(open) => !open && setRevertShipment(null)}
          onConfirm={() => handleRevert(revertShipment)}
          currentStage={revertShipment.stage}
          previousStage={getPreviousStage(revertShipment.stage) || 'pricing'}
          referenceId={revertShipment.referenceId}
        />
      )}
    </div>
  );
}
