import { useMemo, useState } from 'react';
import { useFilteredShipments } from '@/hooks/useFilteredShipments';
import { useShipments } from '@/hooks/useShipments';
import { useAuth } from '@/hooks/useAuth';
import { canEditOnPage } from '@/lib/permissions';
import { UserRole } from '@/types/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { StageFilter } from '@/components/ui/StageFilter';
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
  const { shipments: allShipments, isLoading } = useFilteredShipments();
  const { updateShipment } = useShipments();
  const { roles } = useAuth();
  const userRoles = (roles || []) as UserRole[];
  const canEdit = canEditOnPage(userRoles, '/collections');
  const [showHistory, setShowHistory] = useState(false);

  const collections = useMemo(() => {
    // Current: Only pending collections (completed + has completedAt + not collected)
    // History: All completed shipments with completedAt
    const filtered = showHistory
      ? allShipments.filter((s) => s.stage === 'completed' && s.completedAt)
      : allShipments.filter((s) => s.stage === 'completed' && s.completedAt && !s.paymentCollected);
    
    return filtered.map((s) => {
      const daysToAdd = parseInt(s.paymentTerms) || 0;
      const dueDate = addDays(new Date(s.completedAt!), daysToAdd);
      return { shipment: s, dueDate };
    });
  }, [allShipments, showHistory]);

  const getStatus = (dueDate: Date) => {
    if (isBefore(dueDate, new Date()) && !isToday(dueDate)) {
      return { label: 'Overdue', className: 'status-overdue', icon: AlertCircle };
    }
    if (isToday(dueDate) || isBefore(dueDate, addDays(new Date(), 3))) {
      return { label: 'Due Soon', className: 'status-pending', icon: Clock };
    }
    return { label: 'Upcoming', className: 'status-active', icon: Clock };
  };

  const handleMarkCollected = async (shipmentId: string, referenceId: string) => {
    await updateShipment(shipmentId, {
      paymentCollected: true,
      paymentCollectedDate: new Date(),
    });
    toast.success(`Payment collected for ${referenceId}`);
  };

  const sortedCollections = [...collections].sort(
    (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
  );

  const totalOutstanding = collections.reduce(
    (sum, c) => sum + (c.shipment.totalInvoiceAmount || 0),
    0
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Collections"
        description="Track payments due from clients"
        action={<StageFilter showHistory={showHistory} onToggle={setShowHistory} />}
      />

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="p-4 glass-card rounded-xl">
          <p className="text-sm text-muted-foreground">Total Outstanding</p>
          <p className="text-2xl font-heading font-bold">${totalOutstanding.toLocaleString()}</p>
        </div>
        <div className="p-4 glass-card rounded-xl">
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
              <TableHead className="text-muted-foreground">Route</TableHead>
              <TableHead className="text-muted-foreground">Due Date</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-right">Amount</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCollections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                      <span className="text-muted-foreground">{shipment.portOfLoading}</span>
                      <span className="mx-2">→</span>
                      <span>{shipment.portOfDischarge}</span>
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
                      ${shipment.totalInvoiceAmount?.toLocaleString() || '0'}
                    </TableCell>
                    <TableCell className="text-right">
                      {shipment.paymentCollected ? (
                        <span className="text-success text-sm font-medium flex items-center justify-end gap-1">
                          <Check className="w-4 h-4" />
                          Collected
                        </span>
                      ) : canEdit ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkCollected(shipment.id, shipment.referenceId)}
                          className="h-8 gap-1 text-success hover:text-success"
                        >
                          <Check className="w-4 h-4" />
                          Mark Collected
                        </Button>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled
                              className="h-8 gap-1"
                            >
                              <AlertTriangle className="w-4 h-4" />
                              No Edit Access
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>You don't have permission to mark collections</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
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
