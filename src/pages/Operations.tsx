import { useMemo, useState } from 'react';
import { useFilteredShipments } from '@/hooks/useFilteredShipments';
import { useAuth } from '@/hooks/useAuth';
import { useTrackedShipmentActions } from '@/hooks/useTrackedShipmentActions';
import { canRevertStage, getPreviousStage } from '@/lib/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { OperationsCombinedTable } from '@/components/tables/OperationsCombinedTable';
import { OperationsForm } from '@/components/forms/OperationsForm';
import { RevertConfirmDialog } from '@/components/dialogs/RevertConfirmDialog';
import { StageFilter } from '@/components/ui/StageFilter';
import { Shipment } from '@/types/shipment';
import { hasReachedStage } from '@/lib/stageOrder';
import { UserRole } from '@/types/permissions';
import { toast } from 'sonner';

export default function Operations() {
  const { shipments: allShipments, isLoading } = useFilteredShipments();
  const { roles } = useAuth();
  const { trackRevertStage } = useTrackedShipmentActions();
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [revertShipment, setRevertShipment] = useState<Shipment | null>(null);
  
  const userRoles = (roles || []) as UserRole[];

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
  
  const handleRevert = async (shipment: Shipment) => {
    const previousStage = getPreviousStage(shipment.stage);
    if (!previousStage) return;
    
    await trackRevertStage(shipment, previousStage);
    toast.success(`${shipment.referenceId} reverted to ${previousStage}`);
    setRevertShipment(null);
  };
  
  // Check if user can revert operations stage shipments
  const canRevert = canRevertStage(userRoles, 'operations');
  
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
        action={<StageFilter showHistory={showHistory} onToggle={setShowHistory} />}
      />
      
      <OperationsCombinedTable
        shipments={shipments}
        onEdit={showHistory ? undefined : handleEdit}
        onRevert={!showHistory && canRevert ? (ship) => setRevertShipment(ship) : undefined}
      />
      
      <OperationsForm
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
          previousStage={getPreviousStage(revertShipment.stage) || 'confirmed'}
          referenceId={revertShipment.referenceId}
        />
      )}
    </div>
  );
}
