import { useMemo, useState } from 'react';
import { useFilteredShipments } from '@/hooks/useFilteredShipments';
import { useShipments } from '@/hooks/useShipments';
import { useAuth } from '@/hooks/useAuth';
import { canEditPayablesCollections } from '@/lib/permissions';
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
import { format, isBefore, isToday, addDays } from 'date-fns';
import { Check, AlertCircle, Clock, AlertTriangle, Undo2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/currency';
import { Progress } from '@/components/ui/progress';
import { Shipment } from '@/types/shipment';
import { PartialPaymentDialog } from '@/components/collections/PartialPaymentDialog';

export default function Collections() {
  const { shipments: allShipments, isLoading } = useFilteredShipments();
  const { updateShipment } = useShipments();
  const { roles, profile } = useAuth();
  const userRoles = (roles || []) as UserRole[];
  const userName = profile?.name;
  const [showHistory, setShowHistory] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  // Helper to check if user can edit a specific shipment's collections
  const canEditShipmentCollections = (shipment: Shipment) => 
    canEditPayablesCollections(shipment, userRoles, userName);

  const collections = useMemo(() => {
    // Show shipments as soon as invoice amount is entered (no need for completed stage)
    const filtered = showHistory
      ? allShipments.filter((s) => s.totalInvoiceAmount && s.totalInvoiceAmount > 0)
      : allShipments.filter((s) => s.totalInvoiceAmount && s.totalInvoiceAmount > 0 && !s.paymentCollected);
    
    return filtered.map((s) => {
      const daysToAdd = parseInt(s.paymentTerms) || 0;
      // Use lead creation date as base for payment terms calculation
      const dueDate = addDays(new Date(s.createdAt), daysToAdd);
      return { shipment: s, dueDate };
    });
  }, [allShipments, showHistory]);

  const getStatus = (dueDate: Date, isCollected: boolean) => {
    if (isCollected) {
      return { label: 'Collected', className: 'status-success', icon: Check };
    }
    if (isBefore(dueDate, new Date()) && !isToday(dueDate)) {
      return { label: 'Overdue', className: 'status-overdue', icon: AlertCircle };
    }
    if (isToday(dueDate) || isBefore(dueDate, addDays(new Date(), 3))) {
      return { label: 'Due Soon', className: 'status-pending', icon: Clock };
    }
    return { label: 'Upcoming', className: 'status-active', icon: Clock };
  };

  const handleMarkCollected = async (shipmentId: string, referenceId: string) => {
    await updateShipment(shipmentId, {
      paymentCollected: true,
      paymentCollectedDate: new Date(),
    });
    toast.success(`Payment collected for ${referenceId}`);
  };

  const handleUndoCollected = async (shipmentId: string, referenceId: string) => {
    await updateShipment(shipmentId, {
      paymentCollected: false,
      paymentCollectedDate: null,
    });
    toast.success(`Undid collection for ${referenceId}`);
  };

  const handleOpenPaymentDialog = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setPaymentDialogOpen(true);
  };

  const sortedCollections = [...collections].sort(
    (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
  );

  const totalsByCurrency = useMemo(() => {
    const result: Record<string, number> = {};
    collections.forEach((c) => {
      if (c.shipment.paymentCollected) return; // Exclude collected from outstanding
      const currency = c.shipment.currency || 'USD';
      const invoiceAmount = c.shipment.totalInvoiceAmount || 0;
      const collected = c.shipment.amountCollected || 0;
      result[currency] = (result[currency] || 0) + (invoiceAmount - collected);
    });
    return result;
  }, [collections]);

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
        title="Collections"
        description="Track payments due from clients"
        action={<StageFilter showHistory={showHistory} onToggle={setShowHistory} />}
      />

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="p-4 glass-card rounded-xl">
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
        <div className="p-4 glass-card rounded-xl">
          <p className="text-sm text-muted-foreground">Pending Collections</p>
          <p className="text-2xl font-heading font-bold">
            {collections.filter((c) => !c.shipment.paymentCollected).length}
          </p>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Reference ID</TableHead>
              <TableHead className="text-muted-foreground">Salesperson</TableHead>
              <TableHead className="text-muted-foreground">Route</TableHead>
              <TableHead className="text-muted-foreground">Due Date</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Progress</TableHead>
              <TableHead className="text-muted-foreground text-right">Amount</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCollections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No pending collections
                </TableCell>
              </TableRow>
            ) : (
              sortedCollections.map(({ shipment, dueDate }) => {
                const status = getStatus(dueDate, !!shipment.paymentCollected);
                const StatusIcon = status.icon;
                const totalInvoice = shipment.totalInvoiceAmount || 0;
                const amountCollected = shipment.amountCollected || 0;
                const progressPercent = totalInvoice > 0 ? (amountCollected / totalInvoice) * 100 : 0;
                const isPartial = amountCollected > 0 && amountCollected < totalInvoice;
                const canEdit = canEditShipmentCollections(shipment);

                return (
                  <TableRow key={shipment.id} className="border-border/50">
                    <TableCell className="font-mono font-medium text-primary">
                      {shipment.referenceId}
                    </TableCell>
                    <TableCell>{shipment.salesperson}</TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{shipment.portOfLoading}</span>
                      <span className="mx-2">→</span>
                      <span>{shipment.portOfDischarge}</span>
                    </TableCell>
                    <TableCell>{format(dueDate, 'dd MMM yyyy')}</TableCell>
                    <TableCell>
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border',
                        status.className
                      )}>
                        <StatusIcon className="w-3 h-3" />
                        {isPartial ? 'Partial' : status.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="w-24">
                        <Progress value={progressPercent} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatCurrency(amountCollected, shipment.currency)} / {formatCurrency(totalInvoice, shipment.currency)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(totalInvoice - amountCollected, shipment.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {shipment.paymentCollected ? (
                        canEdit ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUndoCollected(shipment.id, shipment.referenceId)}
                            className="h-8 gap-1 text-muted-foreground hover:text-foreground"
                          >
                            <Undo2 className="w-4 h-4" />
                            Undo
                          </Button>
                        ) : (
                          <span className="text-success text-sm font-medium flex items-center justify-end gap-1">
                            <Check className="w-4 h-4" />
                            Collected
                          </span>
                        )
                      ) : canEdit ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenPaymentDialog(shipment)}
                            className="h-8 gap-1"
                          >
                            <CreditCard className="w-4 h-4" />
                            Record
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkCollected(shipment.id, shipment.referenceId)}
                            className="h-8 gap-1 text-success hover:text-success"
                          >
                            <Check className="w-4 h-4" />
                            Mark Full
                          </Button>
                        </div>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled
                              className="h-8 gap-1"
                            >
                              <AlertTriangle className="w-4 h-4" />
                              No Edit Access
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Only the Salesperson, Pricing Owner, Ops Owner, Finance, or Admin can edit</p>
                          </TooltipContent>
                        </Tooltip>
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
        <PartialPaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          shipment={selectedShipment}
        />
      )}
    </div>
  );
}
