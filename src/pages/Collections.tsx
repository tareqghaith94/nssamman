import { useMemo, useState } from 'react';
import { useFilteredShipments } from '@/hooks/useFilteredShipments';
import { useShipments } from '@/hooks/useShipments';
import { useAuth } from '@/hooks/useAuth';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { canEditPayablesCollections } from '@/lib/permissions';
import { UserRole } from '@/types/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { StageFilter } from '@/components/ui/StageFilter';
import { Input } from '@/components/ui/input';
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
import { Check, AlertCircle, Clock, MoreHorizontal, CreditCard, Undo2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { Progress } from '@/components/ui/progress';
import { Shipment } from '@/types/shipment';
import { PartialPaymentDialog } from '@/components/collections/PartialPaymentDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Collections() {
  const { shipments: allShipments, isLoading } = useFilteredShipments();
  const { updateShipment } = useShipments();
  const { roles, profile } = useAuth();
  const { convert } = useExchangeRates();
  const userRoles = (roles || []) as UserRole[];
  const userName = profile?.name;
  const [showHistory, setShowHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const canEditShipmentCollections = (shipment: Shipment) => 
    canEditPayablesCollections(shipment, userRoles, userName);

  const collections = useMemo(() => {
    const filtered = showHistory
      ? allShipments.filter((s) => s.totalInvoiceAmount && s.totalInvoiceAmount > 0)
      : allShipments.filter((s) => s.totalInvoiceAmount && s.totalInvoiceAmount > 0 && !s.paymentCollected);
    
    return filtered.map((s) => {
      const daysToAdd = parseInt(s.paymentTerms) || 0;
      const dueDate = addDays(new Date(s.createdAt), daysToAdd);
      return { shipment: s, dueDate };
    });
  }, [allShipments, showHistory]);

  // Filter by search
  const filteredCollections = useMemo(() => {
    if (!searchQuery.trim()) return collections;
    const q = searchQuery.toLowerCase();
    return collections.filter(({ shipment }) =>
      shipment.referenceId.toLowerCase().includes(q) ||
      (shipment.clientName && shipment.clientName.toLowerCase().includes(q)) ||
      shipment.salesperson.toLowerCase().includes(q)
    );
  }, [collections, searchQuery]);

  const getStatus = (dueDate: Date, isCollected: boolean) => {
    if (isCollected) {
      return { label: 'Collected', className: 'status-success', icon: Check };
    }
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

  const handleUndoCollected = async (shipmentId: string, referenceId: string) => {
    await updateShipment(shipmentId, {
      paymentCollected: false,
      paymentCollectedDate: null,
    });
    toast.success(`Undid collection for ${referenceId}`);
  };

  const handleOpenPaymentDialog = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setPaymentDialogOpen(true);
  };

  const sortedCollections = [...filteredCollections].sort(
    (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
  );

  const { totalOutstanding, hasMixedCurrencies } = useMemo(() => {
    let total = 0;
    const currencies = new Set<string>();
    collections.forEach((c) => {
      if (c.shipment.paymentCollected) return;
      const currency = (c.shipment.currency || 'USD') as 'USD' | 'EUR' | 'JOD';
      currencies.add(currency);
      const invoiceAmount = c.shipment.totalInvoiceAmount || 0;
      const collected = c.shipment.amountCollected || 0;
      total += convert(invoiceAmount - collected, currency, 'USD');
    });
    return { totalOutstanding: total, hasMixedCurrencies: currencies.size > 1 };
  }, [collections, convert]);

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
          <p className="text-sm text-muted-foreground">Total Outstanding {hasMixedCurrencies && <span className="text-xs opacity-60">(converted)</span>}</p>
          <p className="text-2xl font-heading font-bold">
            {formatCurrency(totalOutstanding, 'USD')}
          </p>
        </div>
        <div className="p-4 glass-card rounded-xl">
          <p className="text-sm text-muted-foreground">Pending Collections</p>
          <p className="text-2xl font-heading font-bold">
            {collections.filter((c) => !c.shipment.paymentCollected).length}
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by Reference ID, Client, or Salesperson..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 max-w-sm"
        />
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Reference ID</TableHead>
              <TableHead className="text-muted-foreground">Client</TableHead>
              <TableHead className="text-muted-foreground">Salesperson</TableHead>
              <TableHead className="text-muted-foreground">Due Date</TableHead>
              <TableHead className="text-muted-foreground text-right">Amount</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCollections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No collections match your search' : 'No pending collections'}
                </TableCell>
              </TableRow>
            ) : (
              sortedCollections.map(({ shipment, dueDate }) => {
                const status = getStatus(dueDate, !!shipment.paymentCollected);
                const StatusIcon = status.icon;
                const totalInvoice = shipment.totalInvoiceAmount || 0;
                const amountCollected = shipment.amountCollected || 0;
                const progressPercent = totalInvoice > 0 ? (amountCollected / totalInvoice) * 100 : 0;
                const isPartial = amountCollected > 0 && amountCollected < totalInvoice;
                const canEdit = canEditShipmentCollections(shipment);

                return (
                  <TableRow key={shipment.id} className="border-border/50">
                    <TableCell className="font-mono font-medium text-primary">
                      {shipment.referenceId}
                    </TableCell>
                    <TableCell>{shipment.clientName || '—'}</TableCell>
                    <TableCell>{shipment.salesperson}</TableCell>
                    {/* Due Date + Status merged */}
                    <TableCell>
                      <div>
                        <span>{format(dueDate, 'dd MMM yyyy')}</span>
                        <div className="mt-0.5">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
                            status.className
                          )}>
                            <StatusIcon className="w-3 h-3" />
                            {isPartial ? 'Partial' : status.label}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    {/* Amount + Progress merged */}
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-medium">
                          {formatCurrency(totalInvoice - amountCollected, shipment.currency)}
                        </span>
                        <div className="w-24">
                          <Progress value={progressPercent} className="h-1.5" />
                          <p className="text-xs text-muted-foreground mt-0.5 text-right">
                            {formatCurrency(amountCollected, shipment.currency)} / {formatCurrency(totalInvoice, shipment.currency)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    {/* Actions dropdown */}
                    <TableCell className="text-right">
                      {shipment.paymentCollected ? (
                        canEdit ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover">
                              <DropdownMenuItem onClick={() => handleUndoCollected(shipment.id, shipment.referenceId)}>
                                <Undo2 className="w-3.5 h-3.5 mr-2" />
                                Undo Collection
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <span className="text-success text-sm font-medium flex items-center justify-end gap-1">
                            <Check className="w-4 h-4" />
                            Collected
                          </span>
                        )
                      ) : canEdit ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem onClick={() => handleOpenPaymentDialog(shipment)}>
                              <CreditCard className="w-3.5 h-3.5 mr-2" />
                              Record Payment
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleMarkCollected(shipment.id, shipment.referenceId)}
                              className="text-success focus:text-success"
                            >
                              <Check className="w-3.5 h-3.5 mr-2" />
                              Mark as Fully Paid
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-xs text-muted-foreground">No access</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {selectedShipment && (
        <PartialPaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          shipment={selectedShipment}
        />
      )}
    </div>
  );
}
