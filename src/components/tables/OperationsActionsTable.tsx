import { Shipment } from '@/types/shipment';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Edit2, Check, X } from 'lucide-react';

interface OperationsActionsTableProps {
  shipments: Shipment[];
  onEdit?: (shipment: Shipment) => void;
}

function CheckCell({ value }: { value: boolean | undefined }) {
  return value ? (
    <div className="flex items-center justify-center">
      <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
        <Check className="w-4 h-4 text-success" />
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center">
      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
        <X className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  );
}

function DateCell({ date }: { date: Date | undefined }) {
  if (!date) {
    return <span className="text-muted-foreground">-</span>;
  }
  return <span className="text-sm">{format(new Date(date), 'dd MMM yyyy')}</span>;
}

function TextCell({ value }: { value: string | undefined }) {
  return <span className={value ? 'text-sm' : 'text-muted-foreground'}>{value || '-'}</span>;
}

export function OperationsActionsTable({ shipments, onEdit }: OperationsActionsTableProps) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border/50">
        <h3 className="font-heading font-semibold text-lg">Operations Actions</h3>
        <p className="text-sm text-muted-foreground">Track progress of all shipment actions</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="text-muted-foreground">Reference ID</TableHead>
            <TableHead className="text-muted-foreground">NSS Booking Ref</TableHead>
            <TableHead className="text-muted-foreground">NSS Invoice #</TableHead>
            <TableHead className="text-muted-foreground">BL Type</TableHead>
            <TableHead className="text-muted-foreground text-center">BL Draft</TableHead>
            <TableHead className="text-muted-foreground text-center">Final BL</TableHead>
            <TableHead className="text-muted-foreground">Cutoff Date</TableHead>
            <TableHead className="text-muted-foreground">Gate-in Date</TableHead>
            <TableHead className="text-muted-foreground">ETD</TableHead>
            <TableHead className="text-muted-foreground">ETA</TableHead>
            <TableHead className="text-muted-foreground text-center">Arrival Notice</TableHead>
            <TableHead className="text-muted-foreground text-center">DO Issued</TableHead>
            <TableHead className="text-muted-foreground">DO Release</TableHead>
            <TableHead className="text-muted-foreground text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shipments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
                No shipments found
              </TableCell>
            </TableRow>
          ) : (
            shipments.map((shipment) => (
              <TableRow key={shipment.id} className="border-border/50">
                <TableCell className="font-mono font-medium text-primary">
                  {shipment.referenceId}
                </TableCell>
                <TableCell>
                  <TextCell value={shipment.nssBookingReference} />
                </TableCell>
                <TableCell>
                  <TextCell value={shipment.nssInvoiceNumber} />
                </TableCell>
                <TableCell>
                  <TextCell value={shipment.blType?.toUpperCase()} />
                </TableCell>
                <TableCell>
                  <CheckCell value={shipment.blDraftApproval} />
                </TableCell>
                <TableCell>
                  <CheckCell value={shipment.finalBLIssued} />
                </TableCell>
                <TableCell>
                  <DateCell date={shipment.terminalCutoff} />
                </TableCell>
                <TableCell>
                  <DateCell date={shipment.gateInTerminal} />
                </TableCell>
                <TableCell>
                  <DateCell date={shipment.etd} />
                </TableCell>
                <TableCell>
                  <DateCell date={shipment.eta} />
                </TableCell>
                <TableCell>
                  <CheckCell value={shipment.arrivalNoticeSent} />
                </TableCell>
                <TableCell>
                  <CheckCell value={shipment.doIssued} />
                </TableCell>
                <TableCell>
                  <DateCell date={shipment.doReleaseDate} />
                </TableCell>
                <TableCell className="text-right">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(shipment)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
