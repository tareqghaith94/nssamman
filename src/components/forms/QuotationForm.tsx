import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuotations } from '@/hooks/useQuotations';
import { Shipment, EquipmentItem, ModeOfTransport } from '@/types/shipment';
import { Quotation, QuotationStatus } from '@/types/quotation';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface QuotationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment?: Shipment | null;
  quotation?: Quotation | null;
}

export function QuotationForm({ open, onOpenChange, shipment, quotation }: QuotationFormProps) {
  const { createQuotation, updateQuotation, isCreating, isUpdating } = useQuotations();
  
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [pol, setPol] = useState('');
  const [pod, setPod] = useState('');
  const [modeOfTransport, setModeOfTransport] = useState<ModeOfTransport>('sea');
  const [equipment, setEquipment] = useState<EquipmentItem[]>([{ type: '40hc', quantity: 1 }]);
  const [oceanFreightAmount, setOceanFreightAmount] = useState<string>('');
  const [exwAmount, setExwAmount] = useState<string>('');
  const [exwQty, setExwQty] = useState<string>('');
  const [remarks, setRemarks] = useState('');
  const [validDays, setValidDays] = useState('30');

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      if (quotation) {
        // Editing existing quotation
        setClientName(quotation.clientName);
        setClientAddress(quotation.clientAddress || '');
        setPol(quotation.pol);
        setPod(quotation.pod);
        setModeOfTransport(quotation.modeOfTransport);
        setEquipment(quotation.equipment.length > 0 ? quotation.equipment : [{ type: '40hc', quantity: 1 }]);
        setOceanFreightAmount(quotation.oceanFreightAmount?.toString() || '');
        setExwAmount(quotation.exwAmount?.toString() || '');
        setExwQty(quotation.exwQty?.toString() || '');
        setRemarks(quotation.remarks || '');
      } else if (shipment) {
        // Pre-fill from shipment
        setClientName('');
        setClientAddress('');
        setPol(shipment.portOfLoading);
        setPod(shipment.portOfDischarge);
        setModeOfTransport(shipment.modeOfTransport);
        setEquipment(shipment.equipment.length > 0 ? shipment.equipment : [{ type: '40hc', quantity: 1 }]);
        setOceanFreightAmount(shipment.sellingPricePerUnit?.toString() || '');
        setExwAmount('');
        setExwQty('');
        setRemarks('');
      } else {
        // New blank quotation
        setClientName('');
        setClientAddress('');
        setPol('');
        setPod('');
        setModeOfTransport('sea');
        setEquipment([{ type: '40hc', quantity: 1 }]);
        setOceanFreightAmount('');
        setExwAmount('');
        setExwQty('');
        setRemarks('');
      }
      setValidDays('30');
    }
  }, [open, shipment, quotation]);

  const addEquipment = () => {
    setEquipment([...equipment, { type: '40hc', quantity: 1 }]);
  };

  const removeEquipment = (index: number) => {
    if (equipment.length > 1) {
      setEquipment(equipment.filter((_, i) => i !== index));
    }
  };

  const updateEquipmentType = (index: number, value: string) => {
    const updated = [...equipment];
    updated[index].type = value as EquipmentItem['type'];
    setEquipment(updated);
  };

  const updateEquipmentQty = (index: number, value: string) => {
    const updated = [...equipment];
    updated[index].quantity = Number(value) || 1;
    setEquipment(updated);
  };

  const handleSubmit = async (status: QuotationStatus) => {
    if (!clientName || !pol || !pod) {
      toast.error('Please fill in client name, POL, and POD');
      return;
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + parseInt(validDays));

    try {
      if (quotation) {
        await updateQuotation({
          id: quotation.id,
          clientName,
          clientAddress: clientAddress || undefined,
          pol,
          pod,
          modeOfTransport,
          equipment,
          oceanFreightAmount: oceanFreightAmount ? parseFloat(oceanFreightAmount) : undefined,
          exwAmount: exwAmount ? parseFloat(exwAmount) : undefined,
          exwQty: exwQty ? parseInt(exwQty) : undefined,
          remarks: remarks || undefined,
          status,
          validUntil,
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
          equipment,
          oceanFreightAmount: oceanFreightAmount ? parseFloat(oceanFreightAmount) : undefined,
          exwAmount: exwAmount ? parseFloat(exwAmount) : undefined,
          exwQty: exwQty ? parseInt(exwQty) : undefined,
          remarks: remarks || undefined,
          status,
          validUntil,
          issuedAt: status === 'issued' ? new Date() : undefined,
        });
        toast.success(status === 'issued' ? 'Quotation created and issued' : 'Draft saved');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to save quotation');
    }
  };

  const getTotalUnits = () => equipment.reduce((sum, eq) => sum + eq.quantity, 0);
  const oceanTotal = (parseFloat(oceanFreightAmount) || 0) * getTotalUnits();
  const exwTotal = (parseFloat(exwAmount) || 0) * (parseInt(exwQty) || 0);
  const grandTotal = oceanTotal + exwTotal;

  const isLoading = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

          {/* Equipment - Spreadsheet Style Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Equipment</Label>
              <button
                type="button"
                onClick={addEquipment}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add row
              </button>
            </div>
            <div className="border rounded-md overflow-hidden">
              <div className="grid grid-cols-[1fr_80px_40px] bg-muted/50 text-sm font-medium">
                <div className="p-2 border-r border-border">Type</div>
                <div className="p-2 border-r border-border text-center">Qty</div>
                <div className="p-2"></div>
              </div>
              {equipment.map((eq, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_80px_40px] border-t border-border">
                  <Input
                    value={eq.type}
                    onChange={(e) => updateEquipmentType(idx, e.target.value)}
                    placeholder="40' HC"
                    className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
                  />
                  <Input
                    type="number"
                    value={eq.quantity}
                    onChange={(e) => updateEquipmentQty(idx, e.target.value)}
                    className="border-0 border-l border-border rounded-none text-center focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
                    min={1}
                  />
                  <button
                    type="button"
                    onClick={() => removeEquipment(idx)}
                    className="flex items-center justify-center text-muted-foreground hover:text-destructive border-l border-border h-10"
                    disabled={equipment.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing - Simple Layout */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <Label htmlFor="oceanFreight">Ocean Freight $ (per unit)</Label>
                <Input
                  id="oceanFreight"
                  type="number"
                  value={oceanFreightAmount}
                  onChange={(e) => setOceanFreightAmount(e.target.value)}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <p className="text-sm text-muted-foreground pb-2">
                × {getTotalUnits()} = <span className="font-medium">${oceanTotal.toLocaleString()}</span>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 items-end">
              <div>
                <Label htmlFor="exwAmount">Ex-Works $ (per unit)</Label>
                <Input
                  id="exwAmount"
                  type="number"
                  value={exwAmount}
                  onChange={(e) => setExwAmount(e.target.value)}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="exwQty">Ex-Works Qty</Label>
                <Input
                  id="exwQty"
                  type="number"
                  value={exwQty}
                  onChange={(e) => setExwQty(e.target.value)}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <p className="text-sm text-muted-foreground pb-2">
                = <span className="font-medium">${exwTotal.toLocaleString()}</span>
              </p>
            </div>

            <div className="flex justify-between items-center pt-3 border-t text-lg font-semibold">
              <span>Total</span>
              <span>${grandTotal.toLocaleString()}</span>
            </div>
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
