import { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, Check, FileCheck, AlertCircle, Clock, Eye, MoreHorizontal, Pencil, Undo2, Trash2 } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ShipmentWithPayables, ShipmentPayable, PartyType } from '@/types/payable';
import { PayableTypeBadge } from './PayableTypeBadge';
import { formatCurrency, Currency } from '@/lib/currency';
import { format, isBefore, isToday, addDays, subDays } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface PayableShipmentRowProps {
  shipment: ShipmentWithPayables;
  canEdit: boolean;
  onAddPayable: (shipment: { id: string; referenceId: string; portOfLoading: string; etd: string | null; eta: string | null }) => void;
  onMarkPaid: (payable: ShipmentPayable) => void;
  onUndoPaid: (payable: ShipmentPayable) => void;
  onDeletePayable: (payable: ShipmentPayable) => void;
  onViewInvoice?: (payable: ShipmentPayable) => void;
  onEditPayable?: (payable: ShipmentPayable, shipmentInfo: { portOfLoading: string; etd: string | null; eta: string | null }) => void;
  showPaid?: boolean;
}

export function PayableShipmentRow({
  shipment,
  canEdit,
  onAddPayable,
  onMarkPaid,
  onUndoPaid,
  onDeletePayable,
  onViewInvoice,
  onEditPayable,
  showPaid = false,
}: PayableShipmentRowProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getPayableStatus = (payable: ShipmentPayable) => {
    if (payable.dueDate) {
      const dueDate = new Date(payable.dueDate);
      if (isBefore(dueDate, new Date()) && !isToday(dueDate)) {
        return { label: 'Overdue', className: 'status-overdue', icon: AlertCircle, date: dueDate, isCustom: true };
      }
      if (isToday(dueDate) || isBefore(dueDate, addDays(new Date(), 3))) {
        return { label: 'Due Soon', className: 'status-pending', icon: Clock, date: dueDate, isCustom: true };
      }
      return { label: 'Upcoming', className: 'status-active', icon: Clock, date: dueDate, isCustom: true };
    }

    const isExport = shipment.portOfLoading.toLowerCase().includes('aqaba');
    let reminderDate: Date;

    if (isExport && shipment.etd) {
      reminderDate = addDays(new Date(shipment.etd), 3);
    } else if (shipment.eta) {
      reminderDate = subDays(new Date(shipment.eta), 10);
    } else {
      reminderDate = new Date();
    }

    if (isBefore(reminderDate, new Date()) && !isToday(reminderDate)) {
      return { label: 'Overdue', className: 'status-overdue', icon: AlertCircle, date: reminderDate, isCustom: false };
    }
    if (isToday(reminderDate) || isBefore(reminderDate, addDays(new Date(), 3))) {
      return { label: 'Due Soon', className: 'status-pending', icon: Clock, date: reminderDate, isCustom: false };
    }
    return { label: 'Upcoming', className: 'status-active', icon: Clock, date: reminderDate, isCustom: false };
  };

  const handleEditPayable = (payable: ShipmentPayable) => {
    if (onEditPayable) {
      onEditPayable(payable, {
        portOfLoading: shipment.portOfLoading,
        etd: shipment.etd,
        eta: shipment.eta,
      });
    }
  };

  const visiblePayables = showPaid 
    ? shipment.payables 
    : shipment.payables.filter(p => !p.paid);

  const partySummary = shipment.payables.length === 0 
    ? 'No parties yet' 
    : `${shipment.payables.length} ${shipment.payables.length === 1 ? 'party' : 'parties'}`;

  return (
    <>
      {/* Main Shipment Row */}
      <TableRow className="border-border/50 hover:bg-muted/50">
        <TableCell className="w-10">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
        <TableCell className="font-mono font-medium text-primary">
          {shipment.referenceId}
        </TableCell>
        <TableCell className="max-w-[150px] truncate">
          {shipment.clientName || '—'}
        </TableCell>
        <TableCell className="text-muted-foreground">
          {partySummary}
        </TableCell>
        <TableCell className="text-right font-medium">
          {shipment.totalOutstanding > 0 ? (
            formatCurrency(shipment.totalOutstanding, 'USD')
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell className="text-right">
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddPayable({ id: shipment.id, referenceId: shipment.referenceId, portOfLoading: shipment.portOfLoading, etd: shipment.etd, eta: shipment.eta })}
              className="h-7 gap-1"
            >
              <Plus className="h-3 w-3" />
              Add Party
            </Button>
          )}
        </TableCell>
      </TableRow>

      {/* Expanded Payables Rows */}
      {isOpen && (
        visiblePayables.length === 0 ? (
          <TableRow className="bg-muted/30 border-border/30">
            <TableCell colSpan={6} className="text-center py-4 text-muted-foreground text-sm">
              No payable parties added yet. {canEdit && 'Click "Add Party" to add one.'}
            </TableCell>
          </TableRow>
        ) : (
          visiblePayables.map((payable) => {
            const status = getPayableStatus(payable);
            const StatusIcon = status.icon;
            const hasInvoice = payable.invoiceUploaded;

            return (
              <TableRow key={payable.id} className="bg-muted/30 border-border/30">
                <TableCell></TableCell>
                <TableCell className="pl-8">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">└</span>
                    <PayableTypeBadge type={payable.partyType} />
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <span>{payable.partyName}</span>
                    {payable.paid ? (
                      <span className={cn(
                        'ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
                        'status-success'
                      )}>
                        <Check className="w-3 h-3" />
                        Paid
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border w-fit',
                          status.className
                        )}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(status.date, 'dd MMM')}
                        </span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {hasInvoice ? (
                    <span className="inline-flex items-center gap-1 font-medium text-success text-sm">
                      <FileCheck className="w-3 h-3" />
                      {formatCurrency(payable.invoiceAmount, payable.currency as Currency)}
                    </span>
                  ) : payable.estimatedAmount ? (
                    <span className="text-muted-foreground text-sm">
                      ~{formatCurrency(payable.estimatedAmount, payable.currency as Currency)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right">
                  {canEdit && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        {!payable.paid && (
                          <>
                            <DropdownMenuItem onClick={() => handleEditPayable(payable)}>
                              <Pencil className="w-3.5 h-3.5 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onMarkPaid(payable)}
                              disabled={!hasInvoice}
                              className="text-success focus:text-success"
                            >
                              <Check className="w-3.5 h-3.5 mr-2" />
                              Mark as Paid
                            </DropdownMenuItem>
                          </>
                        )}
                        {payable.paid && (
                          <DropdownMenuItem onClick={() => onUndoPaid(payable)}>
                            <Undo2 className="w-3.5 h-3.5 mr-2" />
                            Undo Payment
                          </DropdownMenuItem>
                        )}
                        {hasInvoice && onViewInvoice && payable.invoiceFilePath && (
                          <DropdownMenuItem onClick={() => onViewInvoice(payable)}>
                            <Eye className="w-3.5 h-3.5 mr-2" />
                            View Invoice
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDeletePayable(payable)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            );
          })
        )
      )}
    </>
  );
}
