import { useMemo, useState } from 'react';
import { useFilteredShipments } from '@/hooks/useFilteredShipments';
import { useShipmentStore } from '@/store/shipmentStore';
import { useAuth } from '@/hooks/useAuth';
import { canEditOnPage } from '@/lib/permissions';
import { UserRole } from '@/types/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
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
import { Check, AlertCircle, Clock, Upload, FileCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Shipment } from '@/types/shipment';
import { InvoiceUploadDialog } from '@/components/payables/InvoiceUploadDialog';

export default function Payables() {
  const allShipments = useFilteredShipments();
  const updateShipment = useShipmentStore((s) => s.updateShipment);
  const { roles } = useAuth();
  const userRoles = (roles || []) as UserRole[];
  const canEdit = canEditOnPage(userRoles, '/payables');
  
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  const payables = useMemo(() => {
    const filtered = allShipments.filter(
      (s) => (s.stage === 'operations' || s.stage === 'completed') && s.agent && s.totalCost && !s.agentPaid
    );
    
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
  }, [allShipments]);
  
  const getStatus = (reminderDate: Date) => {
    if (isBefore(reminderDate, new Date()) && !isToday(reminderDate)) {
      return { label: 'Overdue', className: 'status-overdue', icon: AlertCircle };
    }
    if (isToday(reminderDate) || isBefore(reminderDate, addDays(new Date(), 3))) {
      return { label: 'Due Soon', className: 'status-pending', icon: Clock };
    }
    return { label: 'Upcoming', className: 'status-active', icon: Clock };
  };
  
  const handleMarkPaid = (shipmentId: string, referenceId: string) => {
    updateShipment(shipmentId, {
      agentPaid: true,
      agentPaidDate: new Date(),
    });
    toast.success(`Payment marked as complete for ${referenceId}`);
  };
  
  const handleOpenUploadDialog = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setUploadDialogOpen(true);
  };
  
  const handleInvoiceSubmit = (data: {
    agentInvoiceUploaded: boolean;
    agentInvoiceFileName: string;
    agentInvoiceAmount: number;
    agentInvoiceDate: Date;
  }) => {
    if (selectedShipment) {
      updateShipment(selectedShipment.id, data);
    }
  };
  
  const sortedPayables = [...payables].sort(
    (a, b) => a.reminderDate.getTime() - b.reminderDate.getTime()
  );
  
  // Use invoice amount if available, otherwise use estimated cost
  const totalDue = payables.reduce((sum, p) => {
    const amount = p.shipment.agentInvoiceAmount ?? p.shipment.totalCost ?? 0;
    return sum + amount;
  }, 0);
  
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Payables"
        description="Track payments due to agents"
      />
      
      <div className="mb-6 p-4 glass-card rounded-xl flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total Outstanding</p>
          <p className="text-2xl font-heading font-bold">${totalDue.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Pending Payments</p>
          <p className="text-2xl font-heading font-bold">{payables.length}</p>
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
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border',
                        status.className
                      )}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      ${shipment.totalCost?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {hasInvoice ? (
                        <span className="inline-flex items-center gap-1.5 font-medium text-success">
                          <FileCheck className="w-4 h-4" />
                          ${shipment.agentInvoiceAmount?.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
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
