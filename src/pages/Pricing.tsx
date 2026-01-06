import { useMemo, useState, useEffect, useCallback } from 'react';
import { useFilteredShipments } from '@/hooks/useFilteredShipments';
import { useShipments } from '@/hooks/useShipments';
import { useQuotations } from '@/hooks/useQuotations';
import { useAuth } from '@/hooks/useAuth';
import { useTrackedShipmentActions } from '@/hooks/useTrackedShipmentActions';
import { useLastSeenShipments } from '@/hooks/useLastSeenShipments';
import { canRevertStage, getPreviousStage, canAdvanceStage } from '@/lib/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { ShipmentTable } from '@/components/tables/ShipmentTable';
import { PricingForm } from '@/components/forms/PricingForm';
import { QuotationPreview } from '@/components/quotations/QuotationPreview';
import { RevertConfirmDialog } from '@/components/dialogs/RevertConfirmDialog';
import { ConfirmToOpsDialog } from '@/components/dialogs/ConfirmToOpsDialog';
import { MarkLostDialog } from '@/components/dialogs/MarkLostDialog';
import { StageFilter } from '@/components/ui/StageFilter';
import { Shipment, LostReason } from '@/types/shipment';
import { Quotation } from '@/types/quotation';
import { hasReachedStage } from '@/lib/stageOrder';
import { UserRole } from '@/types/permissions';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Send, CheckCircle, Clock } from 'lucide-react';

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
  const { updateShipment } = useShipments();
  const { quotations } = useQuotations();
  const { roles } = useAuth();
  const { trackRevertStage, trackMoveToStage, logActivity } = useTrackedShipmentActions();
  const { isNewShipment, markAsSeen } = useLastSeenShipments('pricing');
  
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [revertShipment, setRevertShipment] = useState<Shipment | null>(null);
  const [confirmShipment, setConfirmShipment] = useState<Shipment | null>(null);
  const [lostShipment, setLostShipment] = useState<Shipment | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  const userRoles = (roles || []) as UserRole[];

  // Current stage shipments
  const currentShipments = useMemo(
    () => allShipments.filter((ship) => ship.stage === 'pricing' && !ship.isLost),
    [allShipments]
  );

  // For history view, show all that reached pricing stage
  const historyShipments = useMemo(
    () => allShipments.filter((ship) => hasReachedStage(ship.stage, 'pricing')),
    [allShipments]
  );

  const shipments = showHistory ? historyShipments : currentShipments;

  // Quotation stats
  const quoteStats = useMemo(() => {
    const pricingShipmentIds = currentShipments.map(s => s.id);
    const relevantQuotes = quotations.filter(q => pricingShipmentIds.includes(q.shipmentId));
    return {
      draft: relevantQuotes.filter(q => q.status === 'draft').length,
      issued: relevantQuotes.filter(q => q.status === 'issued').length,
      accepted: relevantQuotes.filter(q => q.status === 'accepted').length,
      noQuote: currentShipments.length - relevantQuotes.length,
    };
  }, [currentShipments, quotations]);

  // Get quotation status for a shipment
  const getQuotationStatus = useCallback((shipmentId: string) => {
    const quote = quotations.find(q => q.shipmentId === shipmentId);
    return quote?.status || null;
  }, [quotations]);

  // Handle viewing a quotation
  const handleViewQuote = useCallback((shipment: Shipment) => {
    const quote = quotations.find(q => q.shipmentId === shipment.id);
    if (quote) {
      setPreviewQuotation(quote);
      setPreviewOpen(true);
    }
  }, [quotations]);

  // Mark current shipments as seen when they change
  useEffect(() => {
    if (!showHistory && currentShipments.length > 0 && !isLoading) {
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

  const handleConfirmToOps = async (opsOwner: string) => {
    if (!confirmShipment) return;
    
    setIsProcessing(true);
    try {
      await updateShipment(confirmShipment.id, {
        opsOwner: opsOwner as 'Uma' | 'Rania' | 'Mozayan',
      });
      
      await trackMoveToStage(confirmShipment, 'operations');
      toast.success(`${confirmShipment.referenceId} moved to Operations`);
      setConfirmShipment(null);
    } catch (error) {
      toast.error('Failed to move to Operations');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkLost = async (reason: LostReason) => {
    if (!lostShipment) return;
    
    setIsProcessing(true);
    try {
      await updateShipment(lostShipment.id, {
        isLost: true,
        lostReason: reason,
        lostAt: new Date(),
      });
      
      await logActivity(lostShipment.id, lostShipment.referenceId, 'marked_lost', `Marked as lost: ${reason}`);
      toast.success(`${lostShipment.referenceId} marked as lost`);
      setLostShipment(null);
    } catch (error) {
      toast.error('Failed to mark as lost');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const canRevert = canRevertStage(userRoles, 'pricing');
  const canConfirm = canAdvanceStage(userRoles, 'pricing');
  const canMarkAsLost = userRoles.includes('admin') || userRoles.includes('pricing');

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Pricing"
        description="Process quotation requests, assign agents, and manage quote status"
        action={<StageFilter showHistory={showHistory} onToggle={setShowHistory} />}
      />

      {/* Stats - only show for current view */}
      {!showHistory && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="No Quote"
            value={quoteStats.noQuote}
            icon={<FileText className="h-4 w-4" />}
          />
          <StatCard
            title="Drafts"
            value={quoteStats.draft}
            icon={<Clock className="h-4 w-4" />}
          />
          <StatCard
            title="Issued"
            value={quoteStats.issued}
            icon={<Send className="h-4 w-4" />}
          />
          <StatCard
            title="Accepted"
            value={quoteStats.accepted}
            icon={<CheckCircle className="h-4 w-4" />}
          />
        </div>
      )}
      
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <ShipmentTable
          shipments={shipments}
          onEdit={showHistory ? undefined : handleEdit}
          onRevert={!showHistory && canRevert ? (ship) => setRevertShipment(ship) : undefined}
          onConfirm={!showHistory && canConfirm ? (ship) => setConfirmShipment(ship) : undefined}
          onMarkLost={!showHistory && canMarkAsLost ? (ship) => setLostShipment(ship) : undefined}
          onViewQuote={handleViewQuote}
          showPricing
          showQuotationStatus={!showHistory}
          isNew={showHistory ? undefined : (ship) => isNewShipment(ship.id)}
          getQuotationStatus={getQuotationStatus}
        />
      )}
      
      <PricingForm
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
          previousStage={getPreviousStage(revertShipment.stage) || 'lead'}
          referenceId={revertShipment.referenceId}
        />
      )}

      {confirmShipment && (
        <ConfirmToOpsDialog
          open={!!confirmShipment}
          onOpenChange={(open) => !open && setConfirmShipment(null)}
          onConfirm={handleConfirmToOps}
          referenceId={confirmShipment.referenceId}
          isLoading={isProcessing}
        />
      )}

      {lostShipment && (
        <MarkLostDialog
          open={!!lostShipment}
          onOpenChange={(open) => !open && setLostShipment(null)}
          onConfirm={handleMarkLost}
          referenceId={lostShipment.referenceId}
          isLoading={isProcessing}
        />
      )}

      <QuotationPreview
        quotation={previewQuotation}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
