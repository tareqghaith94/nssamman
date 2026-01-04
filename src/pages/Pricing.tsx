import { useMemo, useState } from 'react';
import { useFilteredShipments } from '@/hooks/useFilteredShipments';
import { useAuth } from '@/hooks/useAuth';
import { useTrackedShipmentActions } from '@/hooks/useTrackedShipmentActions';
import { canRevertStage, getPreviousStage } from '@/lib/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { ShipmentTable } from '@/components/tables/ShipmentTable';
import { PricingForm } from '@/components/forms/PricingForm';
import { QuotationForm } from '@/components/forms/QuotationForm';
import { RevertConfirmDialog } from '@/components/dialogs/RevertConfirmDialog';
import { StageFilter } from '@/components/ui/StageFilter';
import { Shipment } from '@/types/shipment';
import { hasReachedStage } from '@/lib/stageOrder';
import { UserRole } from '@/types/permissions';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

function TableSkeleton() {
  return (
    <div className="rounded-md border">
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Pricing() {
  const { shipments: allShipments, isLoading } = useFilteredShipments();
  const { roles } = useAuth();
  const { trackRevertStage } = useTrackedShipmentActions();
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [revertShipment, setRevertShipment] = useState<Shipment | null>(null);
  const [quoteShipment, setQuoteShipment] = useState<Shipment | null>(null);
  const [quoteFormOpen, setQuoteFormOpen] = useState(false);
  
  const userRoles = (roles || []) as UserRole[];

  const shipments = useMemo(
    () => showHistory
      ? allShipments.filter((ship) => hasReachedStage(ship.stage, 'pricing'))
      : allShipments.filter((ship) => ship.stage === 'pricing' && !ship.isLost),
    [allShipments, showHistory]
  );
  
  const handleEdit = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setFormOpen(true);
  };

  const handleGenerateQuote = (shipment: Shipment) => {
    setQuoteShipment(shipment);
    setQuoteFormOpen(true);
  };
  
  const handleRevert = async (shipment: Shipment) => {
    const previousStage = getPreviousStage(shipment.stage);
    if (!previousStage) return;
    
    await trackRevertStage(shipment, previousStage);
    toast.success(`${shipment.referenceId} reverted to ${previousStage}`);
    setRevertShipment(null);
  };
  
  const canRevert = canRevertStage(userRoles, 'pricing');
  const canQuote = userRoles.includes('admin') || userRoles.includes('pricing');
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Pricing"
        description="Process quotation requests and assign agents"
        action={<StageFilter showHistory={showHistory} onToggle={setShowHistory} />}
      />
      
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <ShipmentTable
          shipments={shipments}
          onEdit={showHistory ? undefined : handleEdit}
          onRevert={!showHistory && canRevert ? (ship) => setRevertShipment(ship) : undefined}
          onGenerateQuote={!showHistory && canQuote ? handleGenerateQuote : undefined}
          showPricing
        />
      )}
      
      <PricingForm
        shipment={selectedShipment}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
      
      <QuotationForm
        open={quoteFormOpen}
        onOpenChange={(open) => {
          setQuoteFormOpen(open);
          if (!open) setQuoteShipment(null);
        }}
        shipment={quoteShipment}
      />
      
      {revertShipment && (
        <RevertConfirmDialog
          open={!!revertShipment}
          onOpenChange={(open) => !open && setRevertShipment(null)}
          onConfirm={() => handleRevert(revertShipment)}
          currentStage={revertShipment.stage}
          previousStage={getPreviousStage(revertShipment.stage) || 'lead'}
          referenceId={revertShipment.referenceId}
        />
      )}
    </div>
  );
}
