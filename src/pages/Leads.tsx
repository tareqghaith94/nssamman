import { useMemo, useState } from 'react';
import { useFilteredShipments } from '@/hooks/useFilteredShipments';
import { useAuth } from '@/hooks/useAuth';
import { useTrackedShipmentActions } from '@/hooks/useTrackedShipmentActions';
import { PageHeader } from '@/components/ui/PageHeader';
import { ShipmentTable } from '@/components/tables/ShipmentTable';
import { LeadForm } from '@/components/forms/LeadForm';
import { LeadEditForm } from '@/components/forms/LeadEditForm';
import { StageAdvanceDialog } from '@/components/dialogs/StageAdvanceDialog';
import { StageFilter } from '@/components/ui/StageFilter';
import { OpsOwnerFilter } from '@/components/ui/OpsOwnerFilter';
import { hasReachedStage } from '@/lib/stageOrder';
import { Shipment } from '@/types/shipment';
import { toast } from 'sonner';

export default function Leads() {
  const { shipments: allShipments, isLoading } = useFilteredShipments();
  const { profile } = useAuth();
  const { trackMoveToStage, updateShipment } = useTrackedShipmentActions();
  const [showHistory, setShowHistory] = useState(false);
  const [showMine, setShowMine] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [confirmShipment, setConfirmShipment] = useState<Shipment | null>(null);

  const currentUserName = profile?.name;

  const shipments = useMemo(() => {
    let result = showHistory
      ? allShipments.filter((ship) => hasReachedStage(ship.stage, 'lead'))
      : allShipments.filter((ship) => ship.stage === 'lead');
    
    if (showMine && currentUserName) {
      result = result.filter((ship) => ship.salesperson === currentUserName);
    }
    
    return result;
  }, [allShipments, showHistory, showMine, currentUserName]);

  const handleEdit = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setEditFormOpen(true);
  };

  const handleAdvanceToPricing = async (assignment?: { pricingOwner?: string }) => {
    if (!confirmShipment) return;
    
    if (assignment?.pricingOwner) {
      await updateShipment(confirmShipment.id, { 
        pricingOwner: assignment.pricingOwner as 'Uma' | 'Rania' | 'Mozayan' 
      });
    }
    
    await trackMoveToStage(confirmShipment, 'pricing');
    toast.success(`${confirmShipment.referenceId} moved to Pricing`);
    setConfirmShipment(null);
  };
  
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
        title="Leads"
        description="Manage incoming shipment requests from the sales team"
        action={
          <div className="flex items-center gap-3">
            {currentUserName && (
              <OpsOwnerFilter showMine={showMine} onToggle={setShowMine} />
            )}
            <StageFilter showHistory={showHistory} onToggle={setShowHistory} />
            <LeadForm />
          </div>
        }
      />
      
      <ShipmentTable 
        shipments={shipments} 
        onEdit={handleEdit} 
        onConfirm={(ship) => setConfirmShipment(ship)}
      />
      
      <LeadEditForm 
        shipment={selectedShipment}
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
      />

      {confirmShipment && (
        <StageAdvanceDialog
          open={!!confirmShipment}
          onOpenChange={(open) => !open && setConfirmShipment(null)}
          onConfirm={handleAdvanceToPricing}
          currentStage="lead"
          targetStage="pricing"
          referenceId={confirmShipment.referenceId}
          currentPricingOwner={confirmShipment.pricingOwner}
        />
      )}
    </div>
  );
}
