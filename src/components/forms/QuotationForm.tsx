import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuotations } from '@/hooks/useQuotations';
import { Shipment, ModeOfTransport } from '@/types/shipment';
import { Quotation, QuotationStatus, QuoteLineItem } from '@/types/quotation';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface QuotationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment?: Shipment | null;
  quotation?: Quotation | null;
}

interface LineItemInput {
  description: string;
  equipmentType: string;
  unitCost: string;
  quantity: string;
}

export function QuotationForm({ open, onOpenChange, shipment, quotation }: QuotationFormProps) {
  const { createQuotation, updateQuotation, fetchLineItems, isCreating, isUpdating } = useQuotations();
  
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [pol, setPol] = useState('');
  const [pod, setPod] = useState('');
  const [modeOfTransport, setModeOfTransport] = useState<ModeOfTransport>('sea');
  const [lineItems, setLineItems] = useState<LineItemInput[]>([
    { description: 'Ocean Freight', equipmentType: '40HC', unitCost: '', quantity: '1' }
  ]);
  const [remarks, setRemarks] = useState('');
  const [validDays, setValidDays] = useState('30');

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      if (quotation) {
        // Editing existing quotation - load line items
        setClientName(quotation.clientName);
        setClientAddress(quotation.clientAddress || '');
        setPol(quotation.pol);
        setPod(quotation.pod);
        setModeOfTransport(quotation.modeOfTransport);
        setRemarks(quotation.remarks || '');
        
        // Load existing line items
        fetchLineItems(quotation.id).then((items) => {
          if (items.length > 0) {
            setLineItems(items.map(item => ({
              description: item.description,
              equipmentType: item.equipmentType || '',
              unitCost: item.unitCost.toString(),
              quantity: item.quantity.toString(),
            })));
          } else {
            // Fallback to equipment-based if no line items
            setLineItems(quotation.equipment.map(eq => ({
              description: 'Ocean Freight',
              equipmentType: eq.type,
              unitCost: (quotation.oceanFreightAmount || 0).toString(),
              quantity: eq.quantity.toString(),
            })));
          }
        }).catch(() => {
          // On error, use equipment
          setLineItems([{ description: 'Ocean Freight', equipmentType: '40HC', unitCost: '', quantity: '1' }]);
        });
      } else if (shipment) {
        // Pre-fill from shipment
        setClientName('');
        setClientAddress('');
        setPol(shipment.portOfLoading);
        setPod(shipment.portOfDischarge);
        setModeOfTransport(shipment.modeOfTransport);
        setRemarks('');
        // Create line items from shipment equipment
        setLineItems(shipment.equipment.map(eq => ({
          description: 'Ocean Freight',
          equipmentType: eq.type,
          unitCost: (shipment.sellingPricePerUnit || 0).toString(),
          quantity: eq.quantity.toString(),
        })));
      } else {
        // New blank quotation
        setClientName('');
        setClientAddress('');
        setPol('');
        setPod('');
        setModeOfTransport('sea');
        setLineItems([{ description: 'Ocean Freight', equipmentType: '40HC', unitCost: '', quantity: '1' }]);
        setRemarks('');
      }
      setValidDays('30');
    }
  }, [open, shipment, quotation, fetchLineItems]);

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', equipmentType: '', unitCost: '', quantity: '1' }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index: number, field: keyof LineItemInput, value: string) => {
    const updated = [...lineItems];
    updated[index][field] = value;
    setLineItems(updated);
  };

  const calculateAmount = (item: LineItemInput) => {
    const cost = parseFloat(item.unitCost) || 0;
    const qty = parseInt(item.quantity) || 0;
    return cost * qty;
  };

  const grandTotal = lineItems.reduce((sum, item) => sum + calculateAmount(item), 0);

  const handleSubmit = async (status: QuotationStatus) => {
    if (!clientName || !pol || !pod) {
      toast.error('Please fill in client name, POL, and POD');
      return;
    }

    if (lineItems.every(item => !item.description)) {
      toast.error('Please add at least one line item');
      return;
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + parseInt(validDays));

    // Convert line items for API
    const lineItemsData = lineItems
      .filter(item => item.description)
      .map(item => ({
        description: item.description,
        equipmentType: item.equipmentType || undefined,
        unitCost: parseFloat(item.unitCost) || 0,
        quantity: parseInt(item.quantity) || 1,
      }));

    try {
      if (quotation) {
        await updateQuotation({
          id: quotation.id,
          clientName,
          clientAddress: clientAddress || undefined,
          pol,
          pod,
          modeOfTransport,
          equipment: [], // No longer using equipment array for pricing
          remarks: remarks || undefined,
          status,
          validUntil,
          lineItems: lineItemsData,
        });
        toast.success('Quotation updated');
      } else {
        await createQuotation({
          shipmentId: shipment?.id,
          clientName,
          clientAddress: clientAddress || undefined,
          pol,
          pod,
          modeOfTransport,
          equipment: [], // No longer using equipment array for pricing
          remarks: remarks || undefined,
          status,
          validUntil,
          issuedAt: status === 'issued' ? new Date() : undefined,
          lineItems: lineItemsData,
        });
        toast.success(status === 'issued' ? 'Quotation created and issued' : 'Draft saved');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to save quotation');
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {quotation ? `Edit ${quotation.quoteNumber}` : shipment ? `Quote for ${shipment.referenceId}` : 'New Quotation'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Client Name */}
          <div>
            <Label htmlFor="clientName">Client Name *</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter client name"
              className="mt-1"
            />
          </div>

          {/* Client Address */}
          <div>
            <Label htmlFor="clientAddress">Client Address</Label>
            <Input
              id="clientAddress"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              placeholder="Optional"
              className="mt-1"
            />
          </div>

          {/* Route - Simple Text Inputs */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="pol">POL *</Label>
              <Input
                id="pol"
                value={pol}
                onChange={(e) => setPol(e.target.value)}
                placeholder="e.g. Aqaba"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="pod">POD *</Label>
              <Input
                id="pod"
                value={pod}
                onChange={(e) => setPod(e.target.value)}
                placeholder="e.g. Shanghai"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="mode">Mode</Label>
              <Input
                id="mode"
                value={modeOfTransport}
                onChange={(e) => setModeOfTransport(e.target.value as ModeOfTransport)}
                placeholder="sea"
                className="mt-1"
              />
            </div>
          </div>

          {/* Line Items - Spreadsheet Style */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Line Items</Label>
              <button
                type="button"
                onClick={addLineItem}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add line
              </button>
            </div>
            <div className="border rounded-md overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[1fr_120px_100px_70px_100px_40px] bg-muted/50 text-sm font-medium">
                <div className="p-2 border-r border-border">Description</div>
                <div className="p-2 border-r border-border">Equip / Type</div>
                <div className="p-2 border-r border-border text-right">Unit Cost</div>
                <div className="p-2 border-r border-border text-center">Qty</div>
                <div className="p-2 border-r border-border text-right">Amount</div>
                <div className="p-2"></div>
              </div>
              {/* Rows */}
              {lineItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_120px_100px_70px_100px_40px] border-t border-border">
                  <Input
                    value={item.description}
                    onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                    placeholder="Ocean Freight"
                    className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
                  />
                  <Input
                    value={item.equipmentType}
                    onChange={(e) => updateLineItem(idx, 'equipmentType', e.target.value)}
                    placeholder="40HC / Per BL"
                    className="border-0 border-l border-border rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
                  />
                  <Input
                    type="number"
                    value={item.unitCost}
                    onChange={(e) => updateLineItem(idx, 'unitCost', e.target.value)}
                    placeholder="0"
                    className="border-0 border-l border-border rounded-none text-right focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
                  />
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)}
                    className="border-0 border-l border-border rounded-none text-center focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
                    min={1}
                  />
                  <div className="flex items-center justify-end border-l border-border px-2 text-sm font-medium bg-muted/30">
                    ${calculateAmount(item).toLocaleString()}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLineItem(idx)}
                    className="flex items-center justify-center text-muted-foreground hover:text-destructive border-l border-border h-10"
                    disabled={lineItems.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {/* Total Row */}
              <div className="grid grid-cols-[1fr_120px_100px_70px_100px_40px] border-t-2 border-border bg-muted/50">
                <div className="col-span-4 p-2 text-right font-semibold">TOTAL</div>
                <div className="p-2 text-right font-bold border-l border-border">
                  ${grandTotal.toLocaleString()}
                </div>
                <div className="border-l border-border"></div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Use "Per BL" in Equipment Type for flat fees (e.g., Documentation Fee, BL Fee)
            </p>
          </div>

          {/* Validity - Simple Input */}
          <div>
            <Label htmlFor="validDays">Valid for (days)</Label>
            <Input
              id="validDays"
              type="number"
              value={validDays}
              onChange={(e) => setValidDays(e.target.value)}
              className="mt-1 w-24"
            />
          </div>

          {/* Remarks */}
          <div>
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Special notes..."
              className="mt-1"
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => handleSubmit('draft')} disabled={isLoading}>
              Save Draft
            </Button>
            <Button onClick={() => handleSubmit('issued')} disabled={isLoading}>
              {quotation ? 'Update & Issue' : 'Issue Quotation'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
