import { useMemo } from 'react';
import { useFilteredShipments } from '@/hooks/useFilteredShipments';
import { useShipmentStore } from '@/store/shipmentStore';
import { useAuth } from '@/hooks/useAuth';
import { canEditOnPage } from '@/lib/permissions';
import { UserRole } from '@/types/permissions';
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
import { Check, AlertCircle, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function Collections() {
  const allShipments = useFilteredShipments();
  const updateShipment = useShipmentStore((s) => s.updateShipment);
  const { roles } = useAuth();
  const userRoles = (roles || []) as UserRole[];
  const canEdit = canEditOnPage(userRoles, '/collections');

  const collections = useMemo(() => {
    const filtered = allShipments.filter(
      (s) => s.stage === 'completed' && s.completedAt && !s.paymentCollected
    );
    
    return filtered.map((s) => {
      const daysToAdd = parseInt(s.paymentTerms) || 0;
      const dueDate = addDays(new Date(s.completedAt!), daysToAdd);
      return { shipment: s, dueDate };
    });
  }, [allShipments]);
  
  const getStatus = (dueDate: Date) => {
    if (isBefore(dueDate, new Date()) && !isToday(dueDate)) {
      return { label: 'Overdue', className: 'status-overdue', icon: AlertCircle };
    }
    if (isToday(dueDate) || isBefore(dueDate, addDays(new Date(), 7))) {
      return { label: 'Due Soon', className: 'status-pending', icon: Clock };
    }
    return { label: 'Upcoming', className: 'status-active', icon: Clock };
  };
  
  const handleMarkCollected = (shipmentId: string, referenceId: string) => {
    updateShipment(shipmentId, {
      paymentCollected: true,
      paymentCollectedDate: new Date(),
    });
    toast.success(`Payment collected for ${referenceId}`);
  };
  
  const sortedCollections = [...collections].sort(
    (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
  );
  
  const totalDue = collections.reduce((sum, c) => sum + (c.shipment.totalInvoiceAmount || 0), 0);
  const missingAmountCount = collections.filter(c => !c.shipment.totalInvoiceAmount).length;
  
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Collections"
        description="Track client payments based on payment terms"
      />
      
      <div className="mb-6 p-4 glass-card rounded-xl flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total Outstanding</p>
          <p className="text-2xl font-heading font-bold">${totalDue.toLocaleString()}</p>
          {missingAmountCount > 0 && (
            <p className="text-xs text-amber-500 flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3" />
              {missingAmountCount} shipment(s) missing invoice amount
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Pending Collections</p>
          <p className="text-2xl font-heading font-bold">{collections.length}</p>
        </div>
      </div>
      
      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Reference ID</TableHead>
              <TableHead className="text-muted-foreground">Salesperson</TableHead>
              <TableHead className="text-muted-foreground">Payment Terms</TableHead>
              <TableHead className="text-muted-foreground">Completed Date</TableHead>
              <TableHead className="text-muted-foreground">Due Date</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-right">Amount</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCollections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No pending collections
                </TableCell>
              </TableRow>
            ) : (
              sortedCollections.map(({ shipment, dueDate }) => {
                const status = getStatus(dueDate);
                const StatusIcon = status.icon;
                
                return (
                  <TableRow key={shipment.id} className="border-border/50">
                    <TableCell className="font-mono font-medium text-primary">
                      {shipment.referenceId}
                    </TableCell>
                    <TableCell>{shipment.salesperson}</TableCell>
                    <TableCell>
                      {shipment.paymentTerms === '0' ? 'Cash' : `${shipment.paymentTerms} Days`}
                    </TableCell>
                    <TableCell>
                      {shipment.completedAt && format(new Date(shipment.completedAt), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>{format(dueDate, 'dd MMM yyyy')}</TableCell>
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
                      {shipment.totalInvoiceAmount ? (
                        `$${shipment.totalInvoiceAmount.toLocaleString()}`
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-amber-500 flex items-center gap-1 justify-end cursor-help">
                              <AlertTriangle className="w-3 h-3" />
                              Not set
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Invoice amount not set in Operations</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkCollected(shipment.id, shipment.referenceId)}
                        className="h-8 gap-1 text-success hover:text-success"
                        disabled={!canEdit}
                      >
                        <Check className="w-4 h-4" />
                        Mark Collected
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
