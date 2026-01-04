import { Shipment, ShipmentStage, LostReason } from '@/types/shipment';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { ArrowRight, Undo2, Edit2, FileText } from 'lucide-react';

const LOST_REASON_LABELS: Record<LostReason, string> = {
  price: 'Price too high',
  competitor: 'Lost to competitor',
  cancelled: 'Customer cancelled',
  timing: 'Schedule/timing issue',
  requirements: 'Requirements not met',
  no_response: 'No response',
  other: 'Other',
};

interface ShipmentTableProps {
  shipments: Shipment[];
  onEdit?: (shipment: Shipment) => void;
  onMoveToNext?: (shipment: Shipment) => void;
  onRevert?: (shipment: Shipment) => void;
  onGenerateQuote?: (shipment: Shipment) => void;
  showPricing?: boolean;
  showOperations?: boolean;
  nextStage?: ShipmentStage;
}

export function ShipmentTable({
  shipments,
  onEdit,
  onMoveToNext,
  onRevert,
  onGenerateQuote,
  showPricing,
  showOperations,
  nextStage,
}: ShipmentTableProps) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="text-muted-foreground">Reference ID</TableHead>
            <TableHead className="text-muted-foreground">Salesperson</TableHead>
            <TableHead className="text-muted-foreground">Route</TableHead>
            <TableHead className="text-muted-foreground">Equipment</TableHead>
            <TableHead className="text-muted-foreground">Stage</TableHead>
            {showPricing && (
              <>
                <TableHead className="text-muted-foreground">Agent</TableHead>
                <TableHead className="text-muted-foreground text-right">Profit</TableHead>
              </>
            )}
            {showOperations && (
              <>
                <TableHead className="text-muted-foreground">ETD</TableHead>
                <TableHead className="text-muted-foreground">ETA</TableHead>
              </>
            )}
            <TableHead className="text-muted-foreground text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shipments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                No shipments found
              </TableCell>
            </TableRow>
          ) : (
            shipments.map((shipment) => (
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
                <TableCell>
                  {shipment.equipment?.map((eq, i) => (
                    <span key={i}>
                      {eq.type?.toUpperCase()} × {eq.quantity}
                      {i < shipment.equipment.length - 1 && ', '}
                    </span>
                  )) || '-'}
                </TableCell>
                <TableCell>
                  {shipment.isLost ? (
                    <Badge variant="destructive" className="text-xs" title={shipment.lostReason ? LOST_REASON_LABELS[shipment.lostReason] : undefined}>
                      Lost
                    </Badge>
                  ) : (
                    <StatusBadge stage={shipment.stage} />
                  )}
                </TableCell>
                {showPricing && (
                  <>
                    <TableCell>{shipment.agent || '-'}</TableCell>
                    <TableCell className="text-right font-medium text-success">
                      {shipment.totalProfit ? `$${shipment.totalProfit.toFixed(2)}` : '-'}
                    </TableCell>
                  </>
                )}
                {showOperations && (
                  <>
                    <TableCell>
                      {shipment.etd ? format(new Date(shipment.etd), 'dd MMM yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      {shipment.eta ? format(new Date(shipment.eta), 'dd MMM yyyy') : '-'}
                    </TableCell>
                  </>
                )}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onRevert && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRevert(shipment)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        title="Undo to previous stage"
                      >
                        <Undo2 className="w-4 h-4" />
                      </Button>
                    )}
                    {onGenerateQuote && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onGenerateQuote(shipment)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                        title="Generate Quotation"
                      >
                        <FileText className="w-4 h-4" />
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
                    {onMoveToNext && nextStage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMoveToNext(shipment)}
                        className="h-8 gap-1 text-primary"
                      >
                        Move to {nextStage}
                        <ArrowRight className="w-4 h-4" />
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
