import { useMemo, useState } from 'react';
import { useFilteredShipments } from '@/hooks/useFilteredShipments';
import { PageHeader } from '@/components/ui/PageHeader';
import { OperationsCombinedTable } from '@/components/tables/OperationsCombinedTable';
import { OperationsForm } from '@/components/forms/OperationsForm';
import { StageFilter } from '@/components/ui/StageFilter';
import { Shipment } from '@/types/shipment';
import { hasReachedStage } from '@/lib/stageOrder';

export default function Operations() {
  const { shipments: allShipments, isLoading } = useFilteredShipments();
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

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
      />
      
      <OperationsForm
        shipment={selectedShipment}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </div>
  );
}
