import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useShipmentStore } from '@/store/shipmentStore';
import { useActivityStore } from '@/store/activityStore';
import { useUserStore } from '@/store/userStore';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Search, Eye, Package, History, DollarSign, FileText } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { Shipment, ShipmentStage } from '@/types/shipment';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ActivityLog } from '@/types/activity';

const stageOptions: { value: ShipmentStage | 'all'; label: string }[] = [
  { value: 'all', label: 'All Stages' },
  { value: 'lead', label: 'Lead' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'operations', label: 'Operations' },
  { value: 'completed', label: 'Completed' },
];

export default function Database() {
  const currentUser = useUserStore((s) => s.currentUser);
  const shipments = useShipmentStore((s) => s.shipments);
  const activities = useActivityStore((s) => s.activities);
  
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<ShipmentStage | 'all'>('all');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Only admin can access this page
  if (currentUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const filteredShipments = shipments.filter((shipment) => {
    const matchesSearch =
      shipment.referenceId.toLowerCase().includes(search.toLowerCase()) ||
      shipment.salesperson.toLowerCase().includes(search.toLowerCase()) ||
      shipment.portOfLoading.toLowerCase().includes(search.toLowerCase()) ||
      shipment.portOfDischarge.toLowerCase().includes(search.toLowerCase()) ||
      (shipment.agent && shipment.agent.toLowerCase().includes(search.toLowerCase()));
    const matchesStage = stageFilter === 'all' || shipment.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const getShipmentActivities = (shipmentId: string): ActivityLog[] => {
    return activities.filter((a) => a.shipmentId === shipmentId);
  };

  const openDetails = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setDetailsOpen(true);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
    return format(new Date(date), 'MMM d, yyyy');
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '-';
    return `$${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shipment Database"
        description="Complete view of all shipments and activity"
      />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by ref, salesperson, port, agent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={stageFilter} onValueChange={(v) => setStageFilter(v as ShipmentStage | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by stage" />
          </SelectTrigger>
          <SelectContent>
            {stageOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[130px]">Reference</TableHead>
              <TableHead className="w-[100px]">Salesperson</TableHead>
              <TableHead>Route</TableHead>
              <TableHead className="w-[100px]">Stage</TableHead>
              <TableHead className="w-[100px]">Agent</TableHead>
              <TableHead className="w-[100px] text-right">Selling</TableHead>
              <TableHead className="w-[100px] text-right">Cost</TableHead>
              <TableHead className="w-[100px] text-right">Profit</TableHead>
              <TableHead className="w-[100px]">Created</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredShipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  No shipments found
                </TableCell>
              </TableRow>
            ) : (
              filteredShipments.map((shipment) => (
                <TableRow key={shipment.id} className={shipment.isLost ? 'opacity-60' : ''}>
                  <TableCell className="font-mono text-sm">
                    {shipment.referenceId}
                    {shipment.isLost && (
                      <Badge variant="destructive" className="ml-2 text-xs">Lost</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{shipment.salesperson}</TableCell>
                  <TableCell className="text-sm">
                    <span className="text-muted-foreground">{shipment.portOfLoading}</span>
                    <span className="mx-1">→</span>
                    <span>{shipment.portOfDischarge}</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge stage={shipment.stage} />
                  </TableCell>
                  <TableCell className="text-sm">{shipment.agent || '-'}</TableCell>
                  <TableCell className="text-right text-sm">
                    {formatCurrency(shipment.totalSellingPrice)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatCurrency(shipment.totalCost)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium text-success">
                    {formatCurrency(shipment.totalProfit)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(shipment.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDetails(shipment)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredShipments.length} of {shipments.length} shipments
      </div>

      {/* Shipment Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Package className="w-5 h-5" />
              {selectedShipment?.referenceId}
              {selectedShipment?.isLost && (
                <Badge variant="destructive">Lost</Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedShipment && (
            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Details
                </TabsTrigger>
                <TabsTrigger value="financials" className="gap-2">
                  <DollarSign className="w-4 h-4" />
                  Financials
                </TabsTrigger>
                <TabsTrigger value="activity" className="gap-2">
                  <History className="w-4 h-4" />
                  Activity
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <DetailItem label="Salesperson" value={selectedShipment.salesperson} />
                  <DetailItem label="Stage" value={<StatusBadge stage={selectedShipment.stage} />} />
                  <DetailItem label="Port of Loading" value={selectedShipment.portOfLoading} />
                  <DetailItem label="Port of Discharge" value={selectedShipment.portOfDischarge} />
                  <DetailItem label="Mode of Transport" value={selectedShipment.modeOfTransport || '-'} />
                  <DetailItem label="Incoterm" value={selectedShipment.incoterm || '-'} />
                  <DetailItem label="Payment Terms" value={`${selectedShipment.paymentTerms} days`} />
                  <DetailItem label="Agent" value={selectedShipment.agent || '-'} />
                  <DetailItem 
                    label="Equipment" 
                    value={selectedShipment.equipment?.map(eq => `${eq.type?.toUpperCase()} × ${eq.quantity}`).join(', ') || '-'} 
                  />
                  <DetailItem label="Created" value={formatDate(selectedShipment.createdAt)} />
                </div>

                {selectedShipment.stage === 'operations' || selectedShipment.stage === 'completed' ? (
                  <>
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium mb-3">Operations Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="NSS Booking Ref" value={selectedShipment.nssBookingReference || '-'} />
                        <DetailItem label="NSS Invoice #" value={selectedShipment.nssInvoiceNumber || '-'} />
                        <DetailItem label="BL Type" value={selectedShipment.blType?.toUpperCase() || '-'} />
                        <DetailItem label="BL Draft Approved" value={selectedShipment.blDraftApproval ? 'Yes' : 'No'} />
                        <DetailItem label="Final BL Issued" value={selectedShipment.finalBLIssued ? 'Yes' : 'No'} />
                        <DetailItem label="ETD" value={formatDate(selectedShipment.etd)} />
                        <DetailItem label="ETA" value={formatDate(selectedShipment.eta)} />
                        <DetailItem label="Arrival Notice Sent" value={selectedShipment.arrivalNoticeSent ? 'Yes' : 'No'} />
                        <DetailItem label="DO Issued" value={selectedShipment.doIssued ? 'Yes' : 'No'} />
                        <DetailItem label="Completed" value={formatDate(selectedShipment.completedAt)} />
                      </div>
                    </div>
                  </>
                ) : null}

                {selectedShipment.isLost && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-3 text-destructive">Lost Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <DetailItem label="Reason" value={selectedShipment.lostReason || '-'} />
                      <DetailItem label="Lost Date" value={formatDate(selectedShipment.lostAt)} />
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="financials" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <DetailItem label="Selling Price/Unit" value={formatCurrency(selectedShipment.sellingPricePerUnit)} />
                  <DetailItem label="Cost/Unit" value={formatCurrency(selectedShipment.costPerUnit)} />
                  <DetailItem label="Profit/Unit" value={formatCurrency(selectedShipment.profitPerUnit)} />
                  <DetailItem label="Total Quantity" value={selectedShipment.equipment?.reduce((sum, eq) => sum + eq.quantity, 0) || '-'} />
                </div>
                <div className="border-t pt-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Total Selling</p>
                      <p className="text-xl font-semibold">{formatCurrency(selectedShipment.totalSellingPrice)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Total Cost</p>
                      <p className="text-xl font-semibold">{formatCurrency(selectedShipment.totalCost)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-sm text-muted-foreground">Total Profit</p>
                      <p className="text-xl font-semibold text-success">{formatCurrency(selectedShipment.totalProfit)}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Payment Status</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem 
                      label="Invoice Amount" 
                      value={formatCurrency(selectedShipment.totalInvoiceAmount)} 
                    />
                    <DetailItem 
                      label="Payment Collected" 
                      value={selectedShipment.paymentCollected ? `Yes (${formatDate(selectedShipment.paymentCollectedDate)})` : 'No'} 
                    />
                    <DetailItem 
                      label="Agent Paid" 
                      value={selectedShipment.agentPaid ? `Yes (${formatDate(selectedShipment.agentPaidDate)})` : 'No'} 
                    />
                    <DetailItem 
                      label="Agent Invoice Amount" 
                      value={formatCurrency(selectedShipment.agentInvoiceAmount)} 
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="mt-4">
                <ShipmentActivityList activities={getShipmentActivities(selectedShipment.id)} />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function ShipmentActivityList({ activities }: { activities: ActivityLog[] }) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No activity recorded for this shipment
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border"
        >
          <div className="flex-1">
            <p className="text-sm font-medium">{activity.description}</p>
            {activity.previousValue && activity.newValue && (
              <p className="text-xs text-muted-foreground mt-1">
                {activity.previousValue} → {activity.newValue}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              By {activity.user} ({activity.userRole}) • {format(new Date(activity.timestamp), 'MMM d, yyyy HH:mm')}
            </p>
          </div>
          <Badge variant="outline" className="text-xs capitalize">
            {activity.type.replace('_', ' ')}
          </Badge>
        </div>
      ))}
    </div>
  );
}
