import { useShipmentStore } from '@/store/shipmentStore';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format, isBefore, isToday, addDays } from 'date-fns';
import { Check, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Payables() {
  const payables = useShipmentStore((s) => s.getPayables());
  const updateShipment = useShipmentStore((s) => s.updateShipment);
  
  const getStatus = (reminderDate: Date) => {
    if (isBefore(reminderDate, new Date()) && !isToday(reminderDate)) {
      return { label: 'Overdue', className: 'status-overdue', icon: AlertCircle };
    }
    if (isToday(reminderDate) || isBefore(reminderDate, addDays(new Date(), 3))) {
      return { label: 'Due Soon', className: 'status-pending', icon: Clock };
    }
    return { label: 'Upcoming', className: 'status-active', icon: Clock };
  };
  
  const handleMarkPaid = (shipmentId: string, referenceId: string) => {
    updateShipment(shipmentId, {
      agentPaid: true,
      agentPaidDate: new Date(),
    });
    toast.success(`Payment marked as complete for ${referenceId}`);
  };
  
  const sortedPayables = [...payables].sort(
    (a, b) => a.reminderDate.getTime() - b.reminderDate.getTime()
  );
  
  const totalDue = payables.reduce((sum, p) => sum + (p.shipment.totalCost || 0), 0);
  
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Payables"
        description="Track payments due to agents"
      />
      
      <div className="mb-6 p-4 glass-card rounded-xl flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total Outstanding</p>
          <p className="text-2xl font-heading font-bold">${totalDue.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Pending Payments</p>
          <p className="text-2xl font-heading font-bold">{payables.length}</p>
        </div>
      </div>
      
      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Reference ID</TableHead>
              <TableHead className="text-muted-foreground">Agent</TableHead>
              <TableHead className="text-muted-foreground">Route</TableHead>
              <TableHead className="text-muted-foreground">Reminder Date</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-right">Amount</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPayables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No pending payables
                </TableCell>
              </TableRow>
            ) : (
              sortedPayables.map(({ shipment, reminderDate }) => {
                const status = getStatus(reminderDate);
                const StatusIcon = status.icon;
                
                return (
                  <TableRow key={shipment.id} className="border-border/50">
                    <TableCell className="font-mono font-medium text-primary">
                      {shipment.referenceId}
                    </TableCell>
                    <TableCell>{shipment.agent}</TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{shipment.portOfLoading}</span>
                      <span className="mx-2">→</span>
                      <span>{shipment.portOfDischarge}</span>
                    </TableCell>
                    <TableCell>{format(reminderDate, 'dd MMM yyyy')}</TableCell>
                    <TableCell>
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border',
                        status.className
                      )}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${shipment.totalCost?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkPaid(shipment.id, shipment.referenceId)}
                        className="h-8 gap-1 text-success hover:text-success"
                      >
                        <Check className="w-4 h-4" />
                        Mark Paid
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
