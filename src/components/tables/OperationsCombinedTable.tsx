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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { Edit2, Check, X, ArrowLeft } from 'lucide-react';
import { useShipments } from '@/hooks/useShipments';

const OPS_OWNERS = ['Uma', 'Rania', 'Mozayan'] as const;

interface OperationsCombinedTableProps {
  shipments: Shipment[];
  onEdit?: (shipment: Shipment) => void;
  onRevert?: (shipment: Shipment) => void;
}

function CheckIcon({ value }: { value: boolean | undefined }) {
  return value ? (
    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
      <Check className="w-3 h-3 text-success" />
    </div>
  ) : (
    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
      <X className="w-3 h-3 text-muted-foreground" />
    </div>
  );
}

function DateCell({ date }: { date: Date | undefined }) {
  if (!date) {
    return <span className="text-muted-foreground text-xs">-</span>;
  }
  return <span className="text-xs">{format(new Date(date), 'dd MMM')}</span>;
}

function TextCell({ value }: { value: string | undefined }) {
  return <span className={value ? 'text-xs' : 'text-muted-foreground text-xs'}>{value || '-'}</span>;
}

export function OperationsCombinedTable({ shipments, onEdit, onRevert }: OperationsCombinedTableProps) {
  const { updateShipment } = useShipments();

  const handleOpsOwnerChange = async (shipmentId: string, value: string) => {
    await updateShipment(shipmentId, { opsOwner: value as 'Uma' | 'Rania' | 'Mozayan' });
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border/50">
        <h3 className="font-heading font-semibold text-lg">Operations Tracker</h3>
        <p className="text-sm text-muted-foreground">Complete view of shipment progress and documentation</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="text-muted-foreground">Reference</TableHead>
            <TableHead className="text-muted-foreground">Salesperson</TableHead>
            <TableHead className="text-muted-foreground">Route</TableHead>
            <TableHead className="text-muted-foreground">Ops Owner</TableHead>
            <TableHead className="text-muted-foreground">Equipment</TableHead>
            <TableHead className="text-muted-foreground">NSS Booking</TableHead>
            <TableHead className="text-muted-foreground">NSS Invoice</TableHead>
            <TableHead className="text-muted-foreground">BL Type</TableHead>
            <TableHead className="text-muted-foreground text-center">
              <div className="flex flex-col items-center">
                <span>BL</span>
                <span className="text-[10px]">Draft / Final</span>
              </div>
            </TableHead>
            <TableHead className="text-muted-foreground">Cutoff</TableHead>
            <TableHead className="text-muted-foreground">Gate-in</TableHead>
            <TableHead className="text-muted-foreground text-center">
              <div className="flex flex-col items-center">
                <span>Voyage</span>
                <span className="text-[10px]">ETD / ETA</span>
              </div>
            </TableHead>
            <TableHead className="text-muted-foreground text-center">
              <div className="flex flex-col items-center">
                <span>Delivery</span>
                <span className="text-[10px]">Arrival / DO</span>
              </div>
            </TableHead>
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
                <TableCell className="font-mono font-medium text-primary text-sm">
                  {shipment.referenceId}
                </TableCell>
                <TableCell className="text-sm">{shipment.salesperson}</TableCell>
                <TableCell className="text-xs">
                  {shipment.portOfLoading} → {shipment.portOfDischarge}
                </TableCell>
                <TableCell>
                  <Select
                    value={shipment.opsOwner || ''}
                    onValueChange={(value) => handleOpsOwnerChange(shipment.id, value)}
                  >
                    <SelectTrigger className="h-8 w-[100px] text-xs">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPS_OWNERS.map((owner) => (
                        <SelectItem key={owner} value={owner} className="text-xs">
                          {owner}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-xs">
                  {(shipment.equipment || []).map(e => `${e.quantity}x${e.type}`).join(', ') || '-'}
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
                  <div className="flex items-center justify-center gap-1">
                    <CheckIcon value={shipment.blDraftApproval} />
                    <CheckIcon value={shipment.finalBLIssued} />
                  </div>
                </TableCell>
                <TableCell>
                  <DateCell date={shipment.terminalCutoff} />
                </TableCell>
                <TableCell>
                  <DateCell date={shipment.gateInTerminal} />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col items-center text-xs">
                    <DateCell date={shipment.etd} />
                    <DateCell date={shipment.eta} />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <CheckIcon value={shipment.arrivalNoticeSent} />
                    <CheckIcon value={shipment.doIssued} />
                  </div>
                </TableCell>
                <TableCell>
                  <DateCell date={shipment.doReleaseDate} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {onRevert && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRevert(shipment)}
                        className="h-8 gap-1 text-muted-foreground hover:text-foreground text-xs"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        Revert
                      </Button>
                    )}
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
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
