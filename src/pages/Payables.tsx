import { useMemo, useState } from 'react';
import { useAllPendingPayables, useShipmentPayables } from '@/hooks/useShipmentPayables';
import { useFilteredShipments } from '@/hooks/useFilteredShipments';
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
import { format, isBefore, isToday, addDays, subDays } from 'date-fns';
import { Check, AlertCircle, Clock, Upload, FileCheck, Undo2, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PayableTypeBadge } from '@/components/payables/PayableTypeBadge';
import { PayableInvoiceDialog } from '@/components/payables/PayableInvoiceDialog';
import { AddPayableDialog } from '@/components/payables/AddPayableDialog';
import { formatCurrency, Currency } from '@/lib/currency';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PayableWithShipment, PartyType } from '@/types/payable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Payables() {
  const [showHistory, setShowHistory] = useState(false);
  const { data: payables = [], isLoading } = useAllPendingPayables(showHistory);
  const { updatePayable, markAsPaid, undoPayment, deletePayable, addPayable } = useShipmentPayables();
  const { shipments: allShipments } = useFilteredShipments();
  const { roles, profile } = useAuth();
  const userRoles = (roles || []) as UserRole[];
  const userName = profile?.name;

  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<PayableWithShipment | null>(null);
  const [selectedShipmentForAdd, setSelectedShipmentForAdd] = useState<{ id: string; referenceId: string } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [payableToDelete, setPayableToDelete] = useState<PayableWithShipment | null>(null);

  // Shipments available to add payables (those with ETD or ETA set)
  const shipmentsWithSchedule = useMemo(() => {
    return allShipments
      .filter((s) => s.etd || s.eta)
      .map((s) => ({ id: s.id, referenceId: s.referenceId }));
  }, [allShipments]);

  // Check if user can edit based on shipment context
  const canEditPayable = (payable: PayableWithShipment) => {
    const shipment = allShipments.find((s) => s.id === payable.shipmentId);
    return shipment ? canEditPayablesCollections(shipment, userRoles, userName) : false;
  };

  const getStatus = (payable: PayableWithShipment) => {
    const isExport = payable.portOfLoading.toLowerCase().includes('aqaba');
    let reminderDate: Date;

    if (isExport && payable.etd) {
      reminderDate = addDays(new Date(payable.etd), 3);
    } else if (payable.eta) {
      reminderDate = subDays(new Date(payable.eta), 10);
    } else {
      reminderDate = new Date();
    }

    if (isBefore(reminderDate, new Date()) && !isToday(reminderDate)) {
      return { label: 'Overdue', className: 'status-overdue', icon: AlertCircle, date: reminderDate };
    }
    if (isToday(reminderDate) || isBefore(reminderDate, addDays(new Date(), 3))) {
      return { label: 'Due Soon', className: 'status-pending', icon: Clock, date: reminderDate };
    }
    return { label: 'Upcoming', className: 'status-active', icon: Clock, date: reminderDate };
  };

  const handleMarkPaid = async (payable: PayableWithShipment) => {
    await markAsPaid.mutateAsync(payable.id);
  };

  const handleUndoPaid = async (payable: PayableWithShipment) => {
    await undoPayment.mutateAsync(payable.id);
  };

  const handleOpenInvoiceDialog = (payable: PayableWithShipment) => {
    setSelectedPayable(payable);
    setInvoiceDialogOpen(true);
  };

  const handleInvoiceSubmit = async (data: {
    id: string;
    invoiceAmount: number;
    invoiceFileName: string;
    invoiceUploaded: boolean;
    invoiceDate: string;
  }) => {
    await updatePayable.mutateAsync(data);
  };

  const handleOpenAddDialog = (shipment: { id: string; referenceId: string }) => {
    setSelectedShipmentForAdd(shipment);
    setAddDialogOpen(true);
  };

  const handleAddPayable = async (data: {
    shipmentId: string;
    partyType: PartyType;
    partyName: string;
    estimatedAmount?: number;
    currency?: string;
    notes?: string;
  }) => {
    await addPayable.mutateAsync(data);
  };

  const handleDeletePayable = (payable: PayableWithShipment) => {
    setPayableToDelete(payable);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (payableToDelete) {
      await deletePayable.mutateAsync(payableToDelete.id);
      setDeleteConfirmOpen(false);
      setPayableToDelete(null);
    }
  };

  // Sort by reminder date
  const sortedPayables = useMemo(() => {
    return [...payables].sort((a, b) => {
      const statusA = getStatus(a);
      const statusB = getStatus(b);
      return statusA.date.getTime() - statusB.date.getTime();
    });
  }, [payables]);

  // Calculate totals by currency
  const totalsByCurrency = useMemo(() => {
    const result: Record<string, number> = {};
    payables.forEach((p) => {
      if (p.paid) return;
      const currency = p.currency || 'USD';
      const amount = p.invoiceAmount ?? p.estimatedAmount ?? 0;
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
        description="Track payments due to agents and vendors"
        action={
          <div className="flex items-center gap-3">
            <Select
              value={selectedShipmentForAdd?.id || ''}
              onValueChange={(v) => {
                const shipment = shipmentsWithSchedule.find((s) => s.id === v);
                if (shipment) handleOpenAddDialog(shipment);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <SelectValue placeholder="Add Payable..." />
                </div>
              </SelectTrigger>
              <SelectContent>
                {shipmentsWithSchedule.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.referenceId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <StageFilter showHistory={showHistory} onToggle={setShowHistory} />
          </div>
        }
      />

      <div className="mb-6 p-4 glass-card rounded-xl flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total Outstanding</p>
          <p className="text-2xl font-heading font-bold">
            {Object.entries(totalsByCurrency).map(([curr, amount], idx) => (
              <span key={curr}>
                {idx > 0 && ' + '}
                {formatCurrency(amount, curr as Currency)}
              </span>
            ))}
            {Object.keys(totalsByCurrency).length === 0 && formatCurrency(0, 'USD')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Pending Payments</p>
          <p className="text-2xl font-heading font-bold">
            {payables.filter((p) => !p.paid).length}
          </p>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Reference ID</TableHead>
              <TableHead className="text-muted-foreground">Party Type</TableHead>
              <TableHead className="text-muted-foreground">Party Name</TableHead>
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
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No pending payables
                </TableCell>
              </TableRow>
            ) : (
              sortedPayables.map((payable) => {
                const status = getStatus(payable);
                const StatusIcon = status.icon;
                const hasInvoice = payable.invoiceUploaded;
                const canEdit = canEditPayable(payable);

                return (
                  <TableRow key={payable.id} className="border-border/50">
                    <TableCell className="font-mono font-medium text-primary">
                      {payable.referenceId}
                    </TableCell>
                    <TableCell>
                      <PayableTypeBadge type={payable.partyType} />
                    </TableCell>
                    <TableCell>{payable.partyName}</TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{payable.portOfLoading}</span>
                      <span className="mx-2">→</span>
                      <span>{payable.portOfDischarge}</span>
                    </TableCell>
                    <TableCell>{format(status.date, 'dd MMM yyyy')}</TableCell>
                    <TableCell>
                      {payable.paid ? (
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
                      {formatCurrency(payable.estimatedAmount, payable.currency as Currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {hasInvoice ? (
                        <span className="inline-flex items-center gap-1.5 font-medium text-success">
                          <FileCheck className="w-4 h-4" />
                          {formatCurrency(payable.invoiceAmount, payable.currency as Currency)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {payable.paid ? (
                        canEdit ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUndoPaid(payable)}
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
                      ) : canEdit ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenInvoiceDialog(payable)}
                            className="h-8 gap-1"
                          >
                            <Upload className="w-4 h-4" />
                            {hasInvoice ? 'Update' : 'Upload'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkPaid(payable)}
                            className="h-8 gap-1 text-success hover:text-success"
                            disabled={!hasInvoice}
                          >
                            <Check className="w-4 h-4" />
                            Mark Paid
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePayable(payable)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
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

      <PayableInvoiceDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        payable={selectedPayable}
        onSubmit={handleInvoiceSubmit}
      />

      {selectedShipmentForAdd && (
        <AddPayableDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          shipmentId={selectedShipmentForAdd.id}
          referenceId={selectedShipmentForAdd.referenceId}
          onSubmit={handleAddPayable}
        />
      )}

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payable</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the payable for "{payableToDelete?.partyName}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
