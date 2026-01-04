import { Shipment } from '@/types/shipment';
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
import { Edit2, Check, X, Circle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface OperationsTableProps {
  shipments: Shipment[];
  onEdit?: (shipment: Shipment) => void;
}

function StageIndicator({ completed, label }: { completed: boolean; label: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center justify-center w-6 h-6 rounded-full ${
            completed 
              ? 'bg-success/20 text-success' 
              : 'bg-muted text-muted-foreground'
          }`}>
            {completed ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3 h-3" />}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}: {completed ? 'Complete' : 'Pending'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ValueIndicator({ value, label }: { value: string | undefined; label: string }) {
  const hasValue = !!value && value.trim() !== '';
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center justify-center w-6 h-6 rounded-full ${
            hasValue 
              ? 'bg-success/20 text-success' 
              : 'bg-muted text-muted-foreground'
          }`}>
            {hasValue ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3 h-3" />}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}: {hasValue ? value : 'Not set'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function DateIndicator({ date, label }: { date: Date | undefined; label: string }) {
  const hasDate = !!date;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center justify-center w-6 h-6 rounded-full ${
            hasDate 
              ? 'bg-success/20 text-success' 
              : 'bg-muted text-muted-foreground'
          }`}>
            {hasDate ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3 h-3" />}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}: {hasDate ? format(new Date(date), 'dd MMM yyyy') : 'Not set'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function OperationsTable({ shipments, onEdit }: OperationsTableProps) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="text-muted-foreground">Reference ID</TableHead>
            <TableHead className="text-muted-foreground">Route</TableHead>
            <TableHead className="text-muted-foreground">Agent</TableHead>
            <TableHead className="text-muted-foreground text-center">
              <span className="text-xs">NSS Ref</span>
            </TableHead>
            <TableHead className="text-muted-foreground text-center">
              <span className="text-xs">Invoice</span>
            </TableHead>
            <TableHead className="text-muted-foreground text-center">
              <span className="text-xs">BL Type</span>
            </TableHead>
            <TableHead className="text-muted-foreground text-center">
              <span className="text-xs">Draft</span>
            </TableHead>
            <TableHead className="text-muted-foreground text-center">
              <span className="text-xs">Final BL</span>
            </TableHead>
            <TableHead className="text-muted-foreground text-center">
              <span className="text-xs">Cutoff</span>
            </TableHead>
            <TableHead className="text-muted-foreground text-center">
              <span className="text-xs">Gate-in</span>
            </TableHead>
            <TableHead className="text-muted-foreground text-center">
              <span className="text-xs">ETD</span>
            </TableHead>
            <TableHead className="text-muted-foreground text-center">
              <span className="text-xs">ETA</span>
            </TableHead>
            <TableHead className="text-muted-foreground text-center">
              <span className="text-xs">Arrival</span>
            </TableHead>
            <TableHead className="text-muted-foreground text-center">
              <span className="text-xs">DO</span>
            </TableHead>
            <TableHead className="text-muted-foreground text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shipments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={15} className="text-center py-8 text-muted-foreground">
                No shipments found
              </TableCell>
            </TableRow>
          ) : (
            shipments.map((shipment) => {
              const completedCount = [
                !!shipment.nssBookingReference,
                !!shipment.nssInvoiceNumber,
                !!shipment.blType,
                shipment.blDraftApproval,
                shipment.finalBLIssued,
                !!shipment.terminalCutoff,
                !!shipment.gateInTerminal,
                !!shipment.etd,
                !!shipment.eta,
                shipment.arrivalNoticeSent,
                shipment.doIssued,
              ].filter(Boolean).length;
              
              return (
                <TableRow key={shipment.id} className="border-border/50">
                  <TableCell className="font-mono font-medium text-primary">
                    {shipment.referenceId}
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">{shipment.portOfLoading}</span>
                    <span className="mx-1">→</span>
                    <span className="text-sm">{shipment.portOfDischarge}</span>
                  </TableCell>
                  <TableCell className="text-sm">{shipment.agent || '-'}</TableCell>
                  <TableCell className="text-center">
                    <ValueIndicator value={shipment.nssBookingReference} label="NSS Booking Reference" />
                  </TableCell>
                  <TableCell className="text-center">
                    <ValueIndicator value={shipment.nssInvoiceNumber} label="NSS Invoice Number" />
                  </TableCell>
                  <TableCell className="text-center">
                    <ValueIndicator value={shipment.blType?.toUpperCase()} label="BL Type" />
                  </TableCell>
                  <TableCell className="text-center">
                    <StageIndicator completed={!!shipment.blDraftApproval} label="BL Draft Approved" />
                  </TableCell>
                  <TableCell className="text-center">
                    <StageIndicator completed={!!shipment.finalBLIssued} label="Final BL Issued" />
                  </TableCell>
                  <TableCell className="text-center">
                    <DateIndicator date={shipment.terminalCutoff} label="Terminal Cutoff" />
                  </TableCell>
                  <TableCell className="text-center">
                    <DateIndicator date={shipment.gateInTerminal} label="Gate-in Terminal" />
                  </TableCell>
                  <TableCell className="text-center">
                    <DateIndicator date={shipment.etd} label="ETD" />
                  </TableCell>
                  <TableCell className="text-center">
                    <DateIndicator date={shipment.eta} label="ETA" />
                  </TableCell>
                  <TableCell className="text-center">
                    <StageIndicator completed={!!shipment.arrivalNoticeSent} label="Arrival Notice Sent" />
                  </TableCell>
                  <TableCell className="text-center">
                    <StageIndicator completed={!!shipment.doIssued} label="DO Issued" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Badge variant="outline" className="text-xs">
                        {completedCount}/11
                      </Badge>
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
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
