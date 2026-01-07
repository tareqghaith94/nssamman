import { useMemo, useState } from 'react';
import { useFilteredShipments } from '@/hooks/useFilteredShipments';
import { useShipments } from '@/hooks/useShipments';
import { useAuth } from '@/hooks/useAuth';
import { canEditOnPage } from '@/lib/permissions';
import { UserRole } from '@/types/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { StageFilter } from '@/components/ui/StageFilter';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format, isBefore, isToday, addDays, subDays } from 'date-fns';
import { Check, AlertCircle, Clock, Upload, FileCheck, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Shipment } from '@/types/shipment';
import { InvoiceUploadDialog } from '@/components/payables/InvoiceUploadDialog';
import { formatCurrency } from '@/lib/currency';

export default function Payables() {
  const { shipments: allShipments, isLoading } = useFilteredShipments();
  const { updateShipment } = useShipments();
  const { roles } = useAuth();
  const userRoles = (roles || []) as UserRole[];
  const canEdit = canEditOnPage(userRoles, '/payables');
  
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const payables = useMemo(() => {
    // Shipments appear in payables once ETD or ETA is set (not waiting for ops completion)
    // Current: Only pending payables (has agent + has ETD or ETA + not paid)
    // History: All shipments with an agent that have ETD or ETA set
    const hasScheduleDates = (s: Shipment) => s.etd || s.eta;
    
    const filtered = showHistory
      ? allShipments.filter((s) => s.agent && s.totalCost && hasScheduleDates(s))
      : allShipments.filter((s) => s.agent && s.totalCost && hasScheduleDates(s) && !s.agentPaid);
    
    return filtered.map((s) => {
      const isExport = s.portOfLoading.toLowerCase().includes('aqaba');
      let reminderDate: Date;
      
      if (isExport && s.etd) {
        reminderDate = addDays(new Date(s.etd), 3);
      } else if (s.eta) {
        reminderDate = subDays(new Date(s.eta), 10);
      } else {
        reminderDate = new Date();
      }
      
      return { shipment: s, reminderDate };
    });
  }, [allShipments, showHistory]);
  
  const getStatus = (reminderDate: Date) => {
    if (isBefore(reminderDate, new Date()) && !isToday(reminderDate)) {
      return { label: 'Overdue', className: 'status-overdue', icon: AlertCircle };
    }
    if (isToday(reminderDate) || isBefore(reminderDate, addDays(new Date(), 3))) {
      return { label: 'Due Soon', className: 'status-pending', icon: Clock };
    }
    return { label: 'Upcoming', className: 'status-active', icon: Clock };
  };
  
  const handleMarkPaid = async (shipmentId: string, referenceId: string) => {
    await updateShipment(shipmentId, {
      agentPaid: true,
      agentPaidDate: new Date(),
    });
    toast.success(`Payment marked as complete for ${referenceId}`);
  };

  const handleUndoPaid = async (shipmentId: string, referenceId: string) => {
    await updateShipment(shipmentId, {
      agentPaid: false,
      agentPaidDate: null,
    });
    toast.success(`Undid payment for ${referenceId}`);
  };
  
  const handleOpenUploadDialog = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setUploadDialogOpen(true);
  };
  
  const handleInvoiceSubmit = async (data: {
    agentInvoiceUploaded: boolean;
    agentInvoiceFileName: string;
    agentInvoiceAmount: number;
    agentInvoiceDate: Date;
  }) => {
    if (selectedShipment) {
      await updateShipment(selectedShipment.id, data);
    }
  };
  
  const sortedPayables = [...payables].sort(
    (a, b) => a.reminderDate.getTime() - b.reminderDate.getTime()
  );
  
  // Use invoice amount if available, otherwise use estimated cost
  // Group by currency for display
  const totalsByCurrency = useMemo(() => {
    const result: Record<string, number> = {};
    payables.forEach((p) => {
      if (p.shipment.agentPaid) return; // Exclude paid from outstanding
      const currency = p.shipment.currency || 'USD';
      const amount = p.shipment.agentInvoiceAmount ?? p.shipment.totalCost ?? 0;
      result[currency] = (result[currency] || 0) + amount;
    });
    return result;
  }, [payables]);
  
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
        title="Payables"
        description="Track payments due to agents"
        action={<StageFilter showHistory={showHistory} onToggle={setShowHistory} />}
      />
      
      <div className="mb-6 p-4 glass-card rounded-xl flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total Outstanding</p>
          <p className="text-2xl font-heading font-bold">
            {Object.entries(totalsByCurrency).map(([curr, amount], idx) => (
              <span key={curr}>
                {idx > 0 && ' + '}
                {formatCurrency(amount, curr as 'USD' | 'EUR' | 'JOD')}
              </span>
            ))}
            {Object.keys(totalsByCurrency).length === 0 && formatCurrency(0, 'USD')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Pending Payments</p>
          <p className="text-2xl font-heading font-bold">
            {payables.filter((p) => !p.shipment.agentPaid).length}
          </p>
        </div>
      </div>
      
      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Reference ID</TableHead>
              <TableHead className="text-muted-foreground">Agent</TableHead>
              <TableHead className="text-muted-foreground">Route</TableHead>
              <TableHead className="text-muted-foreground">Reminder Date</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-right">Est. Amount</TableHead>
              <TableHead className="text-muted-foreground text-right">Invoice Amount</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPayables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No pending payables
                </TableCell>
              </TableRow>
            ) : (
              sortedPayables.map(({ shipment, reminderDate }) => {
                const status = getStatus(reminderDate);
                const StatusIcon = status.icon;
                const hasInvoice = shipment.agentInvoiceUploaded;
                
                return (
                  <TableRow key={shipment.id} className="border-border/50">
                    <TableCell className="font-mono font-medium text-primary">
                      {shipment.referenceId}
                    </TableCell>
                    <TableCell>{shipment.agent}</TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{shipment.portOfLoading}</span>
                      <span className="mx-2">→</span>
                      <span>{shipment.portOfDischarge}</span>
                    </TableCell>
                    <TableCell>{format(reminderDate, 'dd MMM yyyy')}</TableCell>
                    <TableCell>
                      {shipment.agentPaid ? (
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border',
                          'status-success'
                        )}>
                          <Check className="w-3 h-3" />
                          Paid
                        </span>
                      ) : (
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border',
                          status.className
                        )}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(shipment.totalCost, shipment.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {hasInvoice ? (
                        <span className="inline-flex items-center gap-1.5 font-medium text-success">
                          <FileCheck className="w-4 h-4" />
                          {formatCurrency(shipment.agentInvoiceAmount, shipment.currency)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {shipment.agentPaid ? (
                        canEdit ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUndoPaid(shipment.id, shipment.referenceId)}
                            className="h-8 gap-1 text-muted-foreground hover:text-foreground"
                          >
                            <Undo2 className="w-4 h-4" />
                            Undo
                          </Button>
                        ) : (
                          <span className="text-success text-sm font-medium flex items-center justify-end gap-1">
                            <Check className="w-4 h-4" />
                            Paid
                          </span>
                        )
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenUploadDialog(shipment)}
                            className="h-8 gap-1"
                            disabled={!canEdit}
                          >
                            <Upload className="w-4 h-4" />
                            {hasInvoice ? 'Update' : 'Upload'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkPaid(shipment.id, shipment.referenceId)}
                            className="h-8 gap-1 text-success hover:text-success"
                            disabled={!hasInvoice || !canEdit}
                          >
                            <Check className="w-4 h-4" />
                            Mark Paid
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      {selectedShipment && (
        <InvoiceUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          shipment={selectedShipment}
          onSubmit={handleInvoiceSubmit}
        />
      )}
    </div>
  );
}
