import { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, Upload, Check, Undo2, Trash2, FileCheck, AlertCircle, Clock } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ShipmentWithPayables, ShipmentPayable, PartyType } from '@/types/payable';
import { PayableTypeBadge } from './PayableTypeBadge';
import { formatCurrency, Currency } from '@/lib/currency';
import { format, isBefore, isToday, addDays, subDays } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface PayableShipmentRowProps {
  shipment: ShipmentWithPayables;
  canEdit: boolean;
  onAddPayable: (shipment: { id: string; referenceId: string }) => void;
  onUploadInvoice: (payable: ShipmentPayable) => void;
  onMarkPaid: (payable: ShipmentPayable) => void;
  onUndoPaid: (payable: ShipmentPayable) => void;
  onDeletePayable: (payable: ShipmentPayable) => void;
  showPaid?: boolean;
}

export function PayableShipmentRow({
  shipment,
  canEdit,
  onAddPayable,
  onUploadInvoice,
  onMarkPaid,
  onUndoPaid,
  onDeletePayable,
  showPaid = false,
}: PayableShipmentRowProps) {
  const [isOpen, setIsOpen] = useState(shipment.payables.length > 0);

  const getPayableStatus = (payable: ShipmentPayable) => {
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
      return { label: 'Overdue', className: 'status-overdue', icon: AlertCircle, date: reminderDate };
    }
    if (isToday(reminderDate) || isBefore(reminderDate, addDays(new Date(), 3))) {
      return { label: 'Due Soon', className: 'status-pending', icon: Clock, date: reminderDate };
    }
    return { label: 'Upcoming', className: 'status-active', icon: Clock, date: reminderDate };
  };

  // Filter payables based on showPaid
  const visiblePayables = showPaid 
    ? shipment.payables 
    : shipment.payables.filter(p => !p.paid);

  const partySummary = shipment.payables.length === 0 
    ? 'No parties yet' 
    : `${shipment.payables.length} ${shipment.payables.length === 1 ? 'party' : 'parties'}`;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      {/* Main Shipment Row */}
      <TableRow className="border-border/50 hover:bg-muted/50">
        <TableCell className="w-10">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </TableCell>
        <TableCell className="font-mono font-medium text-primary">
          {shipment.referenceId}
        </TableCell>
        <TableCell className="max-w-[150px] truncate">
          {shipment.clientName || '—'}
        </TableCell>
        <TableCell>
          <span className="text-muted-foreground">{shipment.portOfLoading}</span>
          <span className="mx-2">→</span>
          <span>{shipment.portOfDischarge}</span>
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
              onClick={() => onAddPayable({ id: shipment.id, referenceId: shipment.referenceId })}
              className="h-7 gap-1"
            >
              <Plus className="h-3 w-3" />
              Add Party
            </Button>
          )}
        </TableCell>
      </TableRow>

      {/* Expanded Payables Rows */}
      <CollapsibleContent asChild>
        <>
          {visiblePayables.length === 0 ? (
            <TableRow className="bg-muted/30 border-border/30">
              <TableCell colSpan={7} className="text-center py-4 text-muted-foreground text-sm">
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
                  <TableCell>{payable.partyName}</TableCell>
                  <TableCell>
                    {payable.paid ? (
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border',
                        'status-success'
                      )}>
                        <Check className="w-3 h-3" />
                        Paid
                      </span>
                    ) : (
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border',
                        status.className
                      )}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {payable.estimatedAmount 
                      ? formatCurrency(payable.estimatedAmount, payable.currency as Currency)
                      : '—'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    {hasInvoice ? (
                      <span className="inline-flex items-center gap-1 font-medium text-success text-sm">
                        <FileCheck className="w-3 h-3" />
                        {formatCurrency(payable.invoiceAmount, payable.currency as Currency)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {payable.paid ? (
                      canEdit ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onUndoPaid(payable)}
                          className="h-7 gap-1 text-muted-foreground hover:text-foreground"
                        >
                          <Undo2 className="w-3 h-3" />
                          Undo
                        </Button>
                      ) : null
                    ) : canEdit ? (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onUploadInvoice(payable)}
                          className="h-7 gap-1 text-xs"
                        >
                          <Upload className="w-3 h-3" />
                          {hasInvoice ? 'Edit' : 'Invoice'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onMarkPaid(payable)}
                          className="h-7 gap-1 text-xs text-success hover:text-success"
                          disabled={!hasInvoice}
                        >
                          <Check className="w-3 h-3" />
                          Pay
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeletePayable(payable)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </>
      </CollapsibleContent>
    </Collapsible>
  );
}
