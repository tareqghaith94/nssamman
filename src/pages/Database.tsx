import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useShipments } from '@/hooks/useShipments';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import { useAuth } from '@/hooks/useAuth';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { Search, ChevronDown, ChevronUp, Trash2, Download } from 'lucide-react';
import { exportShipmentsToCSV, generateExportFilename } from '@/lib/exportUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { Navigate } from 'react-router-dom';
import { Shipment, ShipmentStage } from '@/types/shipment';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ActivityLog } from '@/types/activity';

const stageOptions: { value: ShipmentStage | 'all'; label: string }[] = [
  { value: 'all', label: 'All Stages' },
  { value: 'lead', label: 'Lead' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'operations', label: 'Operations' },
  { value: 'completed', label: 'Completed' },
];

export default function Database() {
  const { isAdmin, loading } = useAuth();
  const { shipments, clearAllShipments, isLoading } = useShipments();
  const { activities, getActivitiesByShipment } = useActivityLogs();
  
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<ShipmentStage | 'all'>('all');
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  // Show loading while auth is being checked
  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
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
    return getActivitiesByShipment(shipmentId);
  };

  const toggleRow = (shipmentId: string) => {
    setExpandedRows((prev) =>
      prev.includes(shipmentId)
        ? prev.filter((id) => id !== shipmentId)
        : [...prev, shipmentId]
    );
  };

  const toggleAllRows = () => {
    if (expandedRows.length === filteredShipments.length) {
      setExpandedRows([]);
    } else {
      setExpandedRows(filteredShipments.map((s) => s.id));
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
    return format(new Date(date), 'MMM d, yyyy');
  };

  const formatCurrencyValue = (amount: number | undefined, currency?: 'USD' | 'EUR' | 'JOD') => {
    if (amount === undefined || amount === null) return '-';
    const symbol = currency === 'EUR' ? '€' : currency === 'JOD' ? 'JOD ' : '$';
    return `${symbol}${amount.toLocaleString()}`;
  };

  const allExpanded = expandedRows.length === filteredShipments.length && filteredShipments.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shipment Database"
        description="Complete view of all shipments and activity"
      />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
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

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAllRows}
            disabled={filteredShipments.length === 0}
          >
            {allExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Collapse All
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Expand All
              </>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={shipments.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  exportShipmentsToCSV(filteredShipments, generateExportFilename('shipments-filtered'));
                  toast({ title: `Exported ${filteredShipments.length} shipments` });
                }}
                disabled={filteredShipments.length === 0}
              >
                Export Current View ({filteredShipments.length})
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  exportShipmentsToCSV(shipments, generateExportFilename('shipments-all'));
                  toast({ title: `Exported ${shipments.length} shipments` });
                }}
              >
                Export All Data ({shipments.length})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={shipments.length === 0}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all shipment data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {shipments.length} shipments and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    clearAllShipments();
                    toast({ title: 'All shipment data cleared' });
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="w-[130px]">Reference</TableHead>
              <TableHead className="w-[100px]">Salesperson</TableHead>
              <TableHead>Route</TableHead>
              <TableHead className="w-[100px]">Stage</TableHead>
              <TableHead className="w-[100px]">Agent</TableHead>
              <TableHead className="w-[100px] text-right">Selling</TableHead>
              <TableHead className="w-[100px] text-right">Cost</TableHead>
              <TableHead className="w-[100px] text-right">Profit</TableHead>
              <TableHead className="w-[100px]">Created</TableHead>
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
              filteredShipments.map((shipment) => {
                const isExpanded = expandedRows.includes(shipment.id);
                const shipmentActivities = getShipmentActivities(shipment.id);

                return (
                  <Collapsible key={shipment.id} open={isExpanded} onOpenChange={() => toggleRow(shipment.id)} asChild>
                    <>
                      <CollapsibleTrigger asChild>
                        <TableRow 
                          className={`cursor-pointer hover:bg-muted/50 ${shipment.isLost ? 'opacity-60' : ''}`}
                        >
                          <TableCell>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                          </TableCell>
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
                            {formatCurrencyValue(shipment.totalSellingPrice, shipment.currency)}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {formatCurrencyValue(shipment.totalCost, shipment.currency)}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium text-success">
                            {formatCurrencyValue(shipment.totalProfit, shipment.currency)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(shipment.createdAt)}
                          </TableCell>
                        </TableRow>
                      </CollapsibleTrigger>
                      <CollapsibleContent asChild>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableCell colSpan={10} className="p-0">
                            <ExpandedShipmentDetails 
                              shipment={shipment} 
                              activities={shipmentActivities}
                              formatDate={formatDate}
                              formatCurrencyValue={formatCurrencyValue}
                            />
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredShipments.length} of {shipments.length} shipments
      </div>
    </div>
  );
}

function ExpandedShipmentDetails({ 
  shipment, 
  activities,
  formatDate, 
  formatCurrencyValue 
}: { 
  shipment: Shipment; 
  activities: ActivityLog[];
  formatDate: (date: Date | undefined) => string;
  formatCurrencyValue: (amount: number | undefined, currency?: 'USD' | 'EUR' | 'JOD') => string;
}) {
  return (
    <div className="p-4 space-y-4">
      {/* Row 1: Basic Info & Equipment */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <DetailItem label="Mode of Transport" value={shipment.modeOfTransport || '-'} />
        <DetailItem label="Incoterm" value={shipment.incoterm || '-'} />
        <DetailItem label="Payment Terms" value={`${shipment.paymentTerms} days`} />
        <DetailItem 
          label="Equipment" 
          value={shipment.equipment?.map(eq => `${eq.type?.toUpperCase()} × ${eq.quantity}`).join(', ') || '-'} 
        />
        <DetailItem label="Ops Owner" value={shipment.opsOwner || '-'} />
        <DetailItem label="Completed At" value={formatDate(shipment.completedAt)} />
      </div>

      {/* Row 2: Pricing Details */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Pricing</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <DetailItem label="Sell/Unit" value={formatCurrencyValue(shipment.sellingPricePerUnit, shipment.currency)} />
          <DetailItem label="Cost/Unit" value={formatCurrencyValue(shipment.costPerUnit, shipment.currency)} />
          <DetailItem label="Profit/Unit" value={formatCurrencyValue(shipment.profitPerUnit, shipment.currency)} />
          <DetailItem label="Total Quantity" value={shipment.equipment?.reduce((sum, eq) => sum + eq.quantity, 0) || '-'} />
          <DetailItem label="Invoice Amount" value={formatCurrencyValue(shipment.totalInvoiceAmount, shipment.currency)} />
        </div>
      </div>

      {/* Row 3: Operations Details */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Operations</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <DetailItem label="NSS Booking Ref" value={shipment.nssBookingReference || '-'} />
          <DetailItem label="NSS Invoice #" value={shipment.nssInvoiceNumber || '-'} />
          <DetailItem label="BL Type" value={shipment.blType?.toUpperCase() || '-'} />
          <DetailItem label="BL Draft OK" value={shipment.blDraftApproval ? '✓' : '-'} />
          <DetailItem label="Final BL" value={shipment.finalBLIssued ? '✓' : '-'} />
          <DetailItem label="Terminal Cutoff" value={formatDate(shipment.terminalCutoff)} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-3">
          <DetailItem label="Gate-In" value={formatDate(shipment.gateInTerminal)} />
          <DetailItem label="ETD" value={formatDate(shipment.etd)} />
          <DetailItem label="ETA" value={formatDate(shipment.eta)} />
          <DetailItem label="Arrival Notice" value={shipment.arrivalNoticeSent ? '✓' : '-'} />
          <DetailItem label="DO Issued" value={shipment.doIssued ? '✓' : '-'} />
          <DetailItem label="DO Release Date" value={formatDate(shipment.doReleaseDate)} />
        </div>
      </div>

      {/* Row 4: Payments */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Payments</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <DetailItem 
            label="Payment Collected" 
            value={shipment.paymentCollected ? `✓ ${formatDate(shipment.paymentCollectedDate)}` : '-'} 
          />
          <DetailItem 
            label="Agent Paid" 
            value={shipment.agentPaid ? `✓ ${formatDate(shipment.agentPaidDate)}` : '-'} 
          />
          <DetailItem label="Agent Invoice Uploaded" value={shipment.agentInvoiceUploaded ? '✓' : '-'} />
          <DetailItem label="Agent Invoice Amount" value={formatCurrencyValue(shipment.agentInvoiceAmount, shipment.currency)} />
          <DetailItem label="Agent Invoice Date" value={formatDate(shipment.agentInvoiceDate)} />
        </div>
      </div>

      {/* Row 5: Lost Details (if applicable) */}
      {shipment.isLost && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3 text-destructive">Lost Details</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DetailItem label="Lost Reason" value={shipment.lostReason || '-'} />
            <DetailItem label="Lost Date" value={formatDate(shipment.lostAt)} />
          </div>
        </div>
      )}

      {/* Row 6: Activity Log */}
      {activities.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Recent Activity</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="text-xs flex items-center gap-2">
                <span className="text-muted-foreground">{formatDate(activity.timestamp)}</span>
                <span>{activity.description}</span>
                <span className="text-muted-foreground">by {activity.user}</span>
              </div>
            ))}
            {activities.length > 5 && (
              <div className="text-xs text-muted-foreground">
                + {activities.length - 5} more activities
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
