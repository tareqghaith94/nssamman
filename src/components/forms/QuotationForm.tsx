import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

const EQUIPMENT_TYPES = ['20ft', '40ft', '40hc', '45ft', 'lcl', 'breakbulk', 'airfreight'];

export function QuotationForm({ open, onOpenChange, shipment, quotation }: QuotationFormProps) {
  const { createQuotation, updateQuotation, isCreating, isUpdating } = useQuotations();
  
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [pol, setPol] = useState('');
  const [pod, setPod] = useState('');
  const [modeOfTransport, setModeOfTransport] = useState<ModeOfTransport>('sea');
  const [equipment, setEquipment] = useState<EquipmentItem[]>([{ type: '40ft', quantity: 1 }]);
  const [oceanFreightAmount, setOceanFreightAmount] = useState<string>('');
  const [exwAmount, setExwAmount] = useState<string>('');
  const [exwQty, setExwQty] = useState<string>('');
  const [remarks, setRemarks] = useState('');
  const [validDays, setValidDays] = useState('14');

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
        setEquipment(quotation.equipment.length > 0 ? quotation.equipment : [{ type: '40ft', quantity: 1 }]);
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
        setEquipment(shipment.equipment.length > 0 ? shipment.equipment : [{ type: '40ft', quantity: 1 }]);
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
        setEquipment([{ type: '40ft', quantity: 1 }]);
        setOceanFreightAmount('');
        setExwAmount('');
        setExwQty('');
        setRemarks('');
      }
      setValidDays('14');
    }
  }, [open, shipment, quotation]);

  const addEquipment = () => {
    setEquipment([...equipment, { type: '40ft', quantity: 1 }]);
  };

  const removeEquipment = (index: number) => {
    if (equipment.length > 1) {
      setEquipment(equipment.filter((_, i) => i !== index));
    }
  };

  const updateEquipment = (index: number, field: 'type' | 'quantity', value: string | number) => {
    const updated = [...equipment];
    if (field === 'type') {
      updated[index].type = value as EquipmentItem['type'];
    } else {
      updated[index].quantity = Number(value) || 1;
    }
    setEquipment(updated);
  };

  const handleSubmit = async (status: QuotationStatus) => {
    if (!clientName || !pol || !pod) {
      toast.error('Please fill in required fields');
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {quotation ? `Edit ${quotation.quoteNumber}` : shipment ? `Generate Quote for ${shipment.referenceId}` : 'New Quotation'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Client Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validDays">Valid For (Days)</Label>
              <Select value={validDays} onValueChange={setValidDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientAddress">Client Address</Label>
            <Textarea
              id="clientAddress"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              placeholder="Enter client address"
              rows={2}
            />
          </div>

          {/* Route Details */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pol">Port of Loading *</Label>
              <Input
                id="pol"
                value={pol}
                onChange={(e) => setPol(e.target.value)}
                placeholder="e.g., Jebel Ali"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pod">Port of Discharge *</Label>
              <Input
                id="pod"
                value={pod}
                onChange={(e) => setPod(e.target.value)}
                placeholder="e.g., Rotterdam"
              />
            </div>
            <div className="space-y-2">
              <Label>Mode of Transport</Label>
              <Select value={modeOfTransport} onValueChange={(v) => setModeOfTransport(v as ModeOfTransport)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sea">Sea</SelectItem>
                  <SelectItem value="air">Air</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                  <SelectItem value="multimodal">Multimodal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Equipment */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Equipment</Label>
              <Button type="button" variant="outline" size="sm" onClick={addEquipment}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            {equipment.map((eq, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <Select
                  value={eq.type}
                  onValueChange={(v) => updateEquipment(idx, 'type', v)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="1"
                  value={eq.quantity}
                  onChange={(e) => updateEquipment(idx, 'quantity', e.target.value)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">units</span>
                {equipment.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEquipment(idx)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <h3 className="font-medium">Pricing</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="oceanFreight">Ocean Freight (per unit)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                  <Input
                    id="oceanFreight"
                    type="number"
                    value={oceanFreightAmount}
                    onChange={(e) => setOceanFreightAmount(e.target.value)}
                    className="pl-7"
                    placeholder="0.00"
                  />
                </div>
                {oceanTotal > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Total: ${oceanTotal.toLocaleString()} ({getTotalUnits()} units)
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="exw">Ex-Works / Pickup</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input
                      id="exw"
                      type="number"
                      value={exwAmount}
                      onChange={(e) => setExwAmount(e.target.value)}
                      className="pl-7"
                      placeholder="0.00"
                    />
                  </div>
                  <Input
                    type="number"
                    min="0"
                    value={exwQty}
                    onChange={(e) => setExwQty(e.target.value)}
                    className="w-20"
                    placeholder="Qty"
                  />
                </div>
                {exwTotal > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Total: ${exwTotal.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            <div className="pt-2 border-t">
              <p className="text-right font-semibold">
                Grand Total: <span className="text-lg">${grandTotal.toLocaleString()}</span>
              </p>
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Any special notes or conditions..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleSubmit('draft')}
            disabled={isCreating || isUpdating}
          >
            Save Draft
          </Button>
          <Button
            onClick={() => handleSubmit('issued')}
            disabled={isCreating || isUpdating}
          >
            {quotation ? 'Update & Issue' : 'Create & Issue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
