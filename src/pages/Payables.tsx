import { useMemo, useState } from 'react';
import { useShipmentsWithPayables, useShipmentPayables } from '@/hooks/useShipmentPayables';
import { useAuth } from '@/hooks/useAuth';
import { canEditPayablesCollections } from '@/lib/permissions';
import { UserRole } from '@/types/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { StageFilter } from '@/components/ui/StageFilter';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PayableInvoiceDialog } from '@/components/payables/PayableInvoiceDialog';
import { AddPayableDialog } from '@/components/payables/AddPayableDialog';
import { EditPayableDialog } from '@/components/payables/EditPayableDialog';
import { formatCurrency, Currency } from '@/lib/currency';
import { ShipmentPayable, PartyType, ShipmentWithPayables } from '@/types/payable';
import { PayableShipmentRow } from '@/components/payables/PayableShipmentRow';
import { toast } from 'sonner';
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
  const { data: shipmentsWithPayables = [], isLoading } = useShipmentsWithPayables(showHistory);
  const { updatePayable, editPayable, markAsPaid, undoPayment, deletePayable, addPayable, getInvoiceUrl } = useShipmentPayables();
  const { roles, profile } = useAuth();
  const userRoles = (roles || []) as UserRole[];
  const userName = profile?.name;

  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<ShipmentPayable | null>(null);
  const [selectedPayableForEdit, setSelectedPayableForEdit] = useState<ShipmentPayable | null>(null);
  const [selectedShipmentInfo, setSelectedShipmentInfo] = useState<{ portOfLoading: string; etd: string | null; eta: string | null } | undefined>(undefined);
  const [selectedShipmentForAdd, setSelectedShipmentForAdd] = useState<{ id: string; referenceId: string; portOfLoading: string; etd: string | null; eta: string | null } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [payableToDelete, setPayableToDelete] = useState<ShipmentPayable | null>(null);

  // Check if user can edit based on shipment context
  const canEditShipment = (shipment: ShipmentWithPayables) => {
    const shipmentContext = {
      salesperson: shipment.salesperson,
      pricingOwner: shipment.pricingOwner,
      opsOwner: shipment.opsOwner,
    };
    return canEditPayablesCollections(shipmentContext as any, userRoles, userName);
  };

  const handleMarkPaid = async (payable: ShipmentPayable) => {
    await markAsPaid.mutateAsync(payable.id);
  };

  const handleUndoPaid = async (payable: ShipmentPayable) => {
    await undoPayment.mutateAsync(payable.id);
  };

  const handleOpenInvoiceDialog = (payable: ShipmentPayable) => {
    setSelectedPayable(payable);
    setInvoiceDialogOpen(true);
  };

  const handleInvoiceSubmit = async (data: {
    id: string;
    invoiceAmount: number;
    invoiceFileName: string;
    invoiceFilePath: string;
    invoiceUploaded: boolean;
    invoiceDate: string;
  }) => {
    await updatePayable.mutateAsync(data);
  };

  const handleOpenAddDialog = (shipment: { id: string; referenceId: string; portOfLoading: string; etd: string | null; eta: string | null }) => {
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
    dueDate?: string;
  }) => {
    await addPayable.mutateAsync(data);
  };

  const handleOpenEditDialog = (payable: ShipmentPayable, shipmentInfo: { portOfLoading: string; etd: string | null; eta: string | null }) => {
    setSelectedPayableForEdit(payable);
    setSelectedShipmentInfo(shipmentInfo);
    setEditDialogOpen(true);
  };

  const handleEditPayable = async (data: {
    id: string;
    partyType: PartyType;
    partyName: string;
    estimatedAmount: number | null;
    currency: string;
    notes: string | null;
    dueDate: string | null;
  }) => {
    await editPayable.mutateAsync(data);
  };

  const handleDeletePayable = (payable: ShipmentPayable) => {
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

  const handleViewInvoice = async (payable: ShipmentPayable) => {
    if (!payable.invoiceFilePath) {
      toast.error('No invoice file found');
      return;
    }

    try {
      const url = await getInvoiceUrl(payable.invoiceFilePath);
      if (url) {
        window.open(url, '_blank');
      } else {
        toast.error('Failed to get invoice URL');
      }
    } catch (error) {
      console.error('Error viewing invoice:', error);
      toast.error('Failed to view invoice');
    }
  };

  // Calculate totals
  const { totalOutstanding, pendingCount, shipmentCount } = useMemo(() => {
    let total = 0;
    let pending = 0;
    shipmentsWithPayables.forEach((s) => {
      total += s.totalOutstanding;
      pending += s.pendingCount;
    });
    return {
      totalOutstanding: total,
      pendingCount: pending,
      shipmentCount: shipmentsWithPayables.length,
    };
  }, [shipmentsWithPayables]);

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
        description="Track payments due to agents and vendors by shipment"
        action={
          <StageFilter showHistory={showHistory} onToggle={setShowHistory} />
        }
      />

      <div className="mb-6 p-4 glass-card rounded-xl flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total Outstanding</p>
          <p className="text-2xl font-heading font-bold">
            {totalOutstanding > 0 ? formatCurrency(totalOutstanding, 'USD') : formatCurrency(0, 'USD')}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Shipments</p>
          <p className="text-2xl font-heading font-bold">{shipmentCount}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Pending Payments</p>
          <p className="text-2xl font-heading font-bold">{pendingCount}</p>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="w-10"></TableHead>
              <TableHead className="text-muted-foreground">Reference ID</TableHead>
              <TableHead className="text-muted-foreground">Client</TableHead>
              <TableHead className="text-muted-foreground">Route</TableHead>
              <TableHead className="text-muted-foreground">Parties</TableHead>
              <TableHead className="text-muted-foreground text-right">Outstanding</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipmentsWithPayables.length === 0 ? (
              <TableRow>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  No shipments with scheduled dates (ETD/ETA) found
                </td>
              </TableRow>
            ) : (
              shipmentsWithPayables.map((shipment) => (
                <PayableShipmentRow
                  key={shipment.id}
                  shipment={shipment}
                  canEdit={canEditShipment(shipment)}
                  onAddPayable={handleOpenAddDialog}
                  onUploadInvoice={handleOpenInvoiceDialog}
                  onMarkPaid={handleMarkPaid}
                  onUndoPaid={handleUndoPaid}
                  onDeletePayable={handleDeletePayable}
                  onViewInvoice={handleViewInvoice}
                  onEditPayable={handleOpenEditDialog}
                  showPaid={showHistory}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PayableInvoiceDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        payable={selectedPayable ? {
          ...selectedPayable,
          referenceId: '',
          portOfLoading: '',
          portOfDischarge: '',
          etd: null,
          eta: null,
          clientName: null,
        } : null}
        onSubmit={handleInvoiceSubmit}
      />

      {selectedShipmentForAdd && (
        <AddPayableDialog
          open={addDialogOpen}
          onOpenChange={(open) => {
            setAddDialogOpen(open);
            if (!open) setSelectedShipmentForAdd(null);
          }}
          shipmentId={selectedShipmentForAdd.id}
          referenceId={selectedShipmentForAdd.referenceId}
          shipmentInfo={{
            portOfLoading: selectedShipmentForAdd.portOfLoading,
            etd: selectedShipmentForAdd.etd,
            eta: selectedShipmentForAdd.eta,
          }}
          onSubmit={handleAddPayable}
        />
      )}

      <EditPayableDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setSelectedPayableForEdit(null);
            setSelectedShipmentInfo(undefined);
          }
        }}
        payable={selectedPayableForEdit}
        shipmentInfo={selectedShipmentInfo}
        onSubmit={handleEditPayable}
      />

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
