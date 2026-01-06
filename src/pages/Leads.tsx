import { useMemo, useState } from 'react';
import { useFilteredShipments } from '@/hooks/useFilteredShipments';
import { PageHeader } from '@/components/ui/PageHeader';
import { ShipmentTable } from '@/components/tables/ShipmentTable';
import { LeadForm } from '@/components/forms/LeadForm';
import { StageFilter } from '@/components/ui/StageFilter';
import { hasReachedStage } from '@/lib/stageOrder';

export default function Leads() {
  const { shipments: allShipments, isLoading } = useFilteredShipments();
  const [showHistory, setShowHistory] = useState(false);

  const shipments = useMemo(
    () => showHistory
      ? allShipments.filter((ship) => hasReachedStage(ship.stage, 'lead'))
      : allShipments.filter((ship) => ship.stage === 'lead'),
    [allShipments, showHistory]
  );
  
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
            <StageFilter showHistory={showHistory} onToggle={setShowHistory} />
            <LeadForm />
          </div>
        }
      />
      
      <ShipmentTable shipments={shipments} />
    </div>
  );
}
