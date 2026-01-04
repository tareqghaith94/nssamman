import { useState, useMemo } from 'react';
import { useFilteredShipments } from '@/hooks/useFilteredShipments';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Search, Eye, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Shipment } from '@/types/shipment';

const stageLabels: Record<string, string> = {
  lead: 'Lead',
  pricing: 'Pricing',
  confirmed: 'Confirmed',
  operations: 'Operations',
  completed: 'Completed',
};

const stageColors: Record<string, string> = {
  lead: 'status-pending',
  pricing: 'status-active',
  confirmed: 'status-confirmed',
  operations: 'status-active',
  completed: 'status-completed',
};

function formatDate(date: Date | string | undefined): string {
  if (!date) return '—';
  try {
    return format(new Date(date), 'dd MMM yyyy');
  } catch {
    return '—';
  }
}

function formatEquipment(equipment: Shipment['equipment']): string {
  if (!equipment || equipment.length === 0) return '—';
  return equipment.map((e) => `${e.quantity}x ${e.type}`).join(', ');
}

function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null) return '—';
  return `$${amount.toLocaleString()}`;
}

function formatBoolean(value: boolean | undefined): string {
  if (value === undefined) return '—';
  return value ? 'Yes' : 'No';
}

interface ShipmentDetailDialogProps {
  shipment: Shipment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ShipmentDetailDialog({ shipment, open, onOpenChange }: ShipmentDetailDialogProps) {
  if (!shipment) return null;

  const sections = [
    {
      title: 'Basic Information',
      fields: [
        { label: 'Reference ID', value: shipment.referenceId },
        { label: 'Salesperson', value: shipment.salesperson },
        { label: 'Current Stage', value: stageLabels[shipment.stage] },
        { label: 'Created At', value: formatDate(shipment.createdAt) },
        { label: 'Lost', value: formatBoolean(shipment.isLost) },
        { label: 'Lost Reason', value: shipment.lostReason || '—' },
        { label: 'Lost At', value: formatDate(shipment.lostAt) },
      ],
    },
    {
      title: 'Route & Transport',
      fields: [
        { label: 'Port of Loading', value: shipment.portOfLoading },
        { label: 'Port of Discharge', value: shipment.portOfDischarge },
        { label: 'Mode of Transport', value: shipment.modeOfTransport },
        { label: 'Incoterm', value: shipment.incoterm },
        { label: 'Equipment', value: formatEquipment(shipment.equipment) },
        { label: 'Payment Terms', value: `${shipment.paymentTerms} days` },
      ],
    },
    {
      title: 'Pricing & Financials',
      fields: [
        { label: 'Agent', value: shipment.agent || '—' },
        { label: 'Selling Price/Unit', value: formatCurrency(shipment.sellingPricePerUnit) },
        { label: 'Cost/Unit', value: formatCurrency(shipment.costPerUnit) },
        { label: 'Profit/Unit', value: formatCurrency(shipment.profitPerUnit) },
        { label: 'Total Selling Price', value: formatCurrency(shipment.totalSellingPrice) },
        { label: 'Total Cost', value: formatCurrency(shipment.totalCost) },
        { label: 'Total Profit', value: formatCurrency(shipment.totalProfit) },
        { label: 'Total Invoice Amount', value: formatCurrency(shipment.totalInvoiceAmount) },
      ],
    },
    {
      title: 'Operations',
      fields: [
        { label: 'NSS Booking Reference', value: shipment.nssBookingReference || '—' },
        { label: 'NSS Invoice Number', value: shipment.nssInvoiceNumber || '—' },
        { label: 'BL Type', value: shipment.blType || '—' },
        { label: 'BL Draft Approval', value: formatBoolean(shipment.blDraftApproval) },
        { label: 'Final BL Issued', value: formatBoolean(shipment.finalBLIssued) },
        { label: 'Terminal Cutoff', value: formatDate(shipment.terminalCutoff) },
        { label: 'Gate In Terminal', value: formatDate(shipment.gateInTerminal) },
        { label: 'ETD', value: formatDate(shipment.etd) },
        { label: 'ETA', value: formatDate(shipment.eta) },
        { label: 'Arrival Notice Sent', value: formatBoolean(shipment.arrivalNoticeSent) },
        { label: 'DO Issued', value: formatBoolean(shipment.doIssued) },
        { label: 'DO Release Date', value: formatDate(shipment.doReleaseDate) },
        { label: 'Completed At', value: formatDate(shipment.completedAt) },
      ],
    },
    {
      title: 'Payment Tracking',
      fields: [
        { label: 'Payment Collected', value: formatBoolean(shipment.paymentCollected) },
        { label: 'Payment Collected Date', value: formatDate(shipment.paymentCollectedDate) },
        { label: 'Agent Paid', value: formatBoolean(shipment.agentPaid) },
        { label: 'Agent Paid Date', value: formatDate(shipment.agentPaidDate) },
      ],
    },
    {
      title: 'Agent Invoice',
      fields: [
        { label: 'Invoice Uploaded', value: formatBoolean(shipment.agentInvoiceUploaded) },
        { label: 'Invoice File', value: shipment.agentInvoiceFileName || '—' },
        { label: 'Invoice Amount', value: formatCurrency(shipment.agentInvoiceAmount) },
        { label: 'Invoice Date', value: formatDate(shipment.agentInvoiceDate) },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Shipment Details: {shipment.referenceId}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[65vh] pr-4">
          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.title} className="space-y-3">
                <h3 className="text-sm font-semibold text-primary border-b border-border/50 pb-2">
                  {section.title}
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {section.fields.map((field) => (
                    <div key={field.label} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{field.label}:</span>
                      <span className="font-medium text-right">{field.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default function Database() {
  const shipments = useFilteredShipments();
  const [search, setSearch] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const filteredShipments = useMemo(() => {
    if (!search.trim()) return shipments;
    
    const searchLower = search.toLowerCase();
    return shipments.filter((s) =>
      s.referenceId.toLowerCase().includes(searchLower) ||
      s.salesperson.toLowerCase().includes(searchLower) ||
      s.portOfLoading.toLowerCase().includes(searchLower) ||
      s.portOfDischarge.toLowerCase().includes(searchLower) ||
      s.agent?.toLowerCase().includes(searchLower) ||
      s.stage.toLowerCase().includes(searchLower)
    );
  }, [shipments, search]);

  const handleViewDetails = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setDetailDialogOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Database"
        description="Complete log of all shipments and their details"
      />

      {/* Stats Bar */}
      <div className="mb-6 p-4 glass-card rounded-xl flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total Shipments</p>
          <p className="text-2xl font-heading font-bold">{shipments.length}</p>
        </div>
        <div className="flex gap-4">
          {Object.entries(stageLabels).map(([stage, label]) => {
            const count = shipments.filter((s) => s.stage === stage).length;
            return (
              <div key={stage} className="text-center">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-semibold">{count}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by Reference ID, Salesperson, Ports, Agent..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <ScrollArea className="h-[calc(100vh-350px)]">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground sticky top-0 bg-card">Reference ID</TableHead>
                <TableHead className="text-muted-foreground sticky top-0 bg-card">Stage</TableHead>
                <TableHead className="text-muted-foreground sticky top-0 bg-card">Salesperson</TableHead>
                <TableHead className="text-muted-foreground sticky top-0 bg-card">Route</TableHead>
                <TableHead className="text-muted-foreground sticky top-0 bg-card">Agent</TableHead>
                <TableHead className="text-muted-foreground sticky top-0 bg-card">Equipment</TableHead>
                <TableHead className="text-muted-foreground sticky top-0 bg-card text-right">Total Cost</TableHead>
                <TableHead className="text-muted-foreground sticky top-0 bg-card text-right">Profit</TableHead>
                <TableHead className="text-muted-foreground sticky top-0 bg-card">Created</TableHead>
                <TableHead className="text-muted-foreground sticky top-0 bg-card text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShipments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    {search ? 'No shipments match your search' : 'No shipments in database'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredShipments.map((shipment) => (
                  <TableRow key={shipment.id} className="border-border/50">
                    <TableCell className="font-mono font-medium text-primary">
                      {shipment.referenceId}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border',
                        stageColors[shipment.stage]
                      )}>
                        {stageLabels[shipment.stage]}
                      </span>
                    </TableCell>
                    <TableCell>{shipment.salesperson}</TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{shipment.portOfLoading}</span>
                      <span className="mx-1">→</span>
                      <span>{shipment.portOfDischarge}</span>
                    </TableCell>
                    <TableCell>{shipment.agent || '—'}</TableCell>
                    <TableCell className="text-sm">{formatEquipment(shipment.equipment)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(shipment.totalCost)}</TableCell>
                    <TableCell className="text-right">
                      <span className={shipment.totalProfit && shipment.totalProfit > 0 ? 'text-success' : ''}>
                        {formatCurrency(shipment.totalProfit)}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(shipment.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(shipment)}
                        className="h-8 gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View All
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      <ShipmentDetailDialog
        shipment={selectedShipment}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </div>
  );
}
