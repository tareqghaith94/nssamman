import { Shipment, LostReason } from '@/types/shipment';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { MoreHorizontal, Edit2, Undo2, CheckCircle, XCircle } from 'lucide-react';

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
  onRevert?: (shipment: Shipment) => void;
  onConfirm?: (shipment: Shipment) => void;
  onMarkLost?: (shipment: Shipment) => void;
  showPricing?: boolean;
  showOperations?: boolean;
  showQuotationStatus?: boolean;
  isNew?: (shipment: Shipment) => boolean;
  getQuotationStatus?: (shipmentId: string) => string | null;
}

export function ShipmentTable({
  shipments,
  onEdit,
  onRevert,
  onConfirm,
  onMarkLost,
  showPricing,
  showOperations,
  showQuotationStatus,
  isNew,
  getQuotationStatus,
}: ShipmentTableProps) {
  const hasActions = onEdit || onRevert || onConfirm || onMarkLost;

  const getQuoteStatusBadge = (shipmentId: string) => {
    const status = getQuotationStatus?.(shipmentId);
    if (!status) return <Badge variant="outline" className="text-xs">No Quote</Badge>;
    
    switch (status) {
      case 'draft':
        return <Badge variant="secondary" className="text-xs">Draft</Badge>;
      case 'issued':
        return <Badge variant="default" className="text-xs bg-blue-500">Issued</Badge>;
      case 'accepted':
        return <Badge variant="default" className="text-xs bg-green-500">Accepted</Badge>;
      case 'expired':
        return <Badge variant="outline" className="text-xs text-muted-foreground">Expired</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="text-muted-foreground">Reference ID</TableHead>
            <TableHead className="text-muted-foreground">Salesperson</TableHead>
            <TableHead className="text-muted-foreground">Client</TableHead>
            <TableHead className="text-muted-foreground">Route</TableHead>
            <TableHead className="text-muted-foreground">Equipment</TableHead>
            <TableHead className="text-muted-foreground">Stage</TableHead>
            {showQuotationStatus && (
              <TableHead className="text-muted-foreground">Quote</TableHead>
            )}
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
            {hasActions && (
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {shipments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                No shipments found
              </TableCell>
            </TableRow>
          ) : (
            shipments.map((shipment) => {
              const isNewShipment = isNew?.(shipment);
              const canConfirmThisShipment = onConfirm && !shipment.isLost;
              const canMarkLostThisShipment = onMarkLost && !shipment.isLost;
              
              return (
                <TableRow 
                  key={shipment.id} 
                  className={`border-border/50 ${isNewShipment ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                >
                  <TableCell className="font-mono font-medium text-primary">
                    <div className="flex items-center gap-2">
                      {shipment.referenceId}
                      {isNewShipment && (
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                          New
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{shipment.salesperson}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {shipment.clientName || '-'}
                  </TableCell>
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
                  {showQuotationStatus && (
                    <TableCell>
                      {getQuoteStatusBadge(shipment.id)}
                    </TableCell>
                  )}
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
                  {hasActions && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(shipment)}
                            className="h-8 w-8 p-0"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
                        {(onRevert || canConfirmThisShipment || canMarkLostThisShipment) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-background">
                              {canConfirmThisShipment && (
                                <DropdownMenuItem onClick={() => onConfirm(shipment)}>
                                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                  Confirm → Ops
                                </DropdownMenuItem>
                              )}
                              {canMarkLostThisShipment && (
                                <DropdownMenuItem onClick={() => onMarkLost(shipment)} className="text-destructive">
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Mark Lost
                                </DropdownMenuItem>
                              )}
                              {(canConfirmThisShipment || canMarkLostThisShipment) && onRevert && (
                                <DropdownMenuSeparator />
                              )}
                              {onRevert && (
                                <DropdownMenuItem onClick={() => onRevert(shipment)}>
                                  <Undo2 className="w-4 h-4 mr-2" />
                                  Undo to Previous Stage
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
