import { useMemo, useState, useEffect } from 'react';
import { useFilteredShipments } from '@/hooks/useFilteredShipments';
import { useAuth } from '@/hooks/useAuth';
import { useTrackedShipmentActions } from '@/hooks/useTrackedShipmentActions';
import { useLastSeenShipments } from '@/hooks/useLastSeenShipments';
import { canRevertStage, getPreviousStage } from '@/lib/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { OperationsCombinedTable } from '@/components/tables/OperationsCombinedTable';
import { OperationsChecklist } from '@/components/operations/OperationsChecklist';
import { RevertConfirmDialog } from '@/components/dialogs/RevertConfirmDialog';
import { StageFilter } from '@/components/ui/StageFilter';
import { OpsOwnerFilter } from '@/components/ui/OpsOwnerFilter';
import { Shipment } from '@/types/shipment';
import { hasReachedStage } from '@/lib/stageOrder';
import { UserRole } from '@/types/permissions';
import { toast } from 'sonner';

export default function Operations() {
  const { shipments: allShipments, isLoading } = useFilteredShipments();
  const { roles, profile } = useAuth();
  const { trackRevertStage } = useTrackedShipmentActions();
  const { isNewShipment, markAsSeen } = useLastSeenShipments('operations');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showMine, setShowMine] = useState(false);
  const [revertShipment, setRevertShipment] = useState<Shipment | null>(null);
  
  const userRoles = (roles || []) as UserRole[];
  
  // Get current user's name for ops owner matching
  const currentUserName = profile?.name;

  // Current stage shipments
  const currentShipments = useMemo(
    () => allShipments.filter((ship) => ship.stage === 'operations'),
    [allShipments]
  );

  // For history view, show all that reached operations stage
  const historyShipments = useMemo(
    () => allShipments.filter((ship) => hasReachedStage(ship.stage, 'operations')),
    [allShipments]
  );

  // Apply history and ownership filters
  const shipments = useMemo(() => {
    let result = showHistory ? historyShipments : currentShipments;
    
    if (showMine && currentUserName) {
      result = result.filter((ship) => ship.opsOwner === currentUserName);
    }
    
    return result;
  }, [showHistory, showMine, currentShipments, historyShipments, currentUserName]);

  // Mark current shipments as seen when they change
  useEffect(() => {
    if (!showHistory && currentShipments.length > 0 && !isLoading) {
      // Delay slightly to allow user to see "new" badges
      const timer = setTimeout(() => {
        markAsSeen(currentShipments.map(s => s.id));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentShipments, showHistory, markAsSeen, isLoading]);
  
  const handleEdit = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setFormOpen(true);
  };
  
  const handleRevert = async (shipment: Shipment) => {
    const previousStage = getPreviousStage(shipment.stage);
    if (!previousStage) return;
    
    await trackRevertStage(shipment, previousStage);
    toast.success(`${shipment.referenceId} reverted to ${previousStage}`);
    setRevertShipment(null);
  };
  
  // Check if user can revert from operations or completed stage
  const canRevertOps = canRevertStage(userRoles, 'operations');
  const canRevertCompleted = canRevertStage(userRoles, 'completed');
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Operations"
        description="Track shipments through the logistics process"
        action={
          <div className="flex items-center gap-3">
            {currentUserName && (
              <OpsOwnerFilter showMine={showMine} onToggle={setShowMine} />
            )}
            <StageFilter showHistory={showHistory} onToggle={setShowHistory} />
          </div>
        }
      />
      
      <OperationsCombinedTable
        shipments={shipments}
        onEdit={showHistory ? undefined : handleEdit}
        onRevert={(canRevertOps || canRevertCompleted) ? (ship) => setRevertShipment(ship) : undefined}
        isNew={showHistory ? undefined : (ship) => isNewShipment(ship.id)}
        currentUserOpsOwner={currentUserName}
      />
      
      <OperationsChecklist
        shipment={selectedShipment}
        open={formOpen}
        onOpenChange={setFormOpen}
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
