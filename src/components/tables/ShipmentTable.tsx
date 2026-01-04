import { Shipment, ShipmentStage } from '@/types/shipment';
import { StatusBadge } from '@/components/ui/StatusBadge';
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
import { ArrowRight, Edit2 } from 'lucide-react';

interface ShipmentTableProps {
  shipments: Shipment[];
  onEdit?: (shipment: Shipment) => void;
  onMoveToNext?: (shipment: Shipment) => void;
  showPricing?: boolean;
  showOperations?: boolean;
  nextStage?: ShipmentStage;
}

export function ShipmentTable({
  shipments,
  onEdit,
  onMoveToNext,
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
                  <StatusBadge stage={shipment.stage} />
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
