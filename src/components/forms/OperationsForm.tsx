import { useState, useEffect } from 'react';
import { useShipmentStore } from '@/store/shipmentStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { toast } from 'sonner';
import { Shipment, BLType } from '@/types/shipment';
import { format } from 'date-fns';

interface OperationsFormProps {
  shipment: Shipment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OperationsForm({ shipment, open, onOpenChange }: OperationsFormProps) {
  const updateShipment = useShipmentStore((s) => s.updateShipment);
  const moveToStage = useShipmentStore((s) => s.moveToStage);
  
  const [formData, setFormData] = useState({
    nssBookingReference: '',
    nssInvoiceNumber: '',
    blType: '' as BLType,
    blDraftApproval: false,
    finalBLIssued: false,
    terminalCutoff: '',
    gateInTerminal: '',
    etd: '',
    eta: '',
    arrivalNoticeSent: false,
    doIssued: false,
    doReleaseDate: '',
    totalInvoiceAmount: 0,
  });
  
  useEffect(() => {
    if (shipment) {
      setFormData({
        nssBookingReference: shipment.nssBookingReference || '',
        nssInvoiceNumber: shipment.nssInvoiceNumber || '',
        blType: shipment.blType || '' as BLType,
        blDraftApproval: shipment.blDraftApproval || false,
        finalBLIssued: shipment.finalBLIssued || false,
        terminalCutoff: shipment.terminalCutoff ? format(new Date(shipment.terminalCutoff), 'yyyy-MM-dd') : '',
        gateInTerminal: shipment.gateInTerminal ? format(new Date(shipment.gateInTerminal), 'yyyy-MM-dd') : '',
        etd: shipment.etd ? format(new Date(shipment.etd), 'yyyy-MM-dd') : '',
        eta: shipment.eta ? format(new Date(shipment.eta), 'yyyy-MM-dd') : '',
        arrivalNoticeSent: shipment.arrivalNoticeSent || false,
        doIssued: shipment.doIssued || false,
        doReleaseDate: shipment.doReleaseDate ? format(new Date(shipment.doReleaseDate), 'yyyy-MM-dd') : '',
        totalInvoiceAmount: shipment.totalInvoiceAmount || 0,
      });
    }
  }, [shipment]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shipment) return;
    
    updateShipment(shipment.id, {
      nssBookingReference: formData.nssBookingReference,
      nssInvoiceNumber: formData.nssInvoiceNumber,
      blType: formData.blType,
      blDraftApproval: formData.blDraftApproval,
      finalBLIssued: formData.finalBLIssued,
      terminalCutoff: formData.terminalCutoff ? new Date(formData.terminalCutoff) : undefined,
      gateInTerminal: formData.gateInTerminal ? new Date(formData.gateInTerminal) : undefined,
      etd: formData.etd ? new Date(formData.etd) : undefined,
      eta: formData.eta ? new Date(formData.eta) : undefined,
      arrivalNoticeSent: formData.arrivalNoticeSent,
      doIssued: formData.doIssued,
      doReleaseDate: formData.doReleaseDate ? new Date(formData.doReleaseDate) : undefined,
      totalInvoiceAmount: formData.totalInvoiceAmount,
    });
    
    toast.success('Operations updated successfully');
    onOpenChange(false);
  };
  
  const handleComplete = () => {
    if (!shipment) return;
    
    if (!formData.totalInvoiceAmount) {
      toast.error('Please enter the total invoice amount before completing');
      return;
    }
    
    updateShipment(shipment.id, {
      nssBookingReference: formData.nssBookingReference,
      nssInvoiceNumber: formData.nssInvoiceNumber,
      blType: formData.blType,
      blDraftApproval: formData.blDraftApproval,
      finalBLIssued: formData.finalBLIssued,
      terminalCutoff: formData.terminalCutoff ? new Date(formData.terminalCutoff) : undefined,
      gateInTerminal: formData.gateInTerminal ? new Date(formData.gateInTerminal) : undefined,
      etd: formData.etd ? new Date(formData.etd) : undefined,
      eta: formData.eta ? new Date(formData.eta) : undefined,
      arrivalNoticeSent: formData.arrivalNoticeSent,
      doIssued: formData.doIssued,
      doReleaseDate: formData.doReleaseDate ? new Date(formData.doReleaseDate) : undefined,
      totalInvoiceAmount: formData.totalInvoiceAmount,
    });
    
    moveToStage(shipment.id, 'completed');
    toast.success('Shipment marked as completed');
    onOpenChange(false);
  };
  
  if (!shipment) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">
            Operations for {shipment.referenceId}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="p-4 rounded-lg bg-muted/50 text-sm space-y-1">
            <p><span className="text-muted-foreground">Route:</span> {shipment.portOfLoading} → {shipment.portOfDischarge}</p>
            <p><span className="text-muted-foreground">Agent:</span> {shipment.agent}</p>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium">Reference Numbers</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nssBooking">NSS Booking Reference</Label>
                <Input
                  id="nssBooking"
                  value={formData.nssBookingReference}
                  onChange={(e) => setFormData({ ...formData, nssBookingReference: e.target.value })}
                  placeholder="Enter booking reference"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nssInvoice">NSS Invoice Number</Label>
                <Input
                  id="nssInvoice"
                  value={formData.nssInvoiceNumber}
                  onChange={(e) => setFormData({ ...formData, nssInvoiceNumber: e.target.value })}
                  placeholder="Enter invoice number"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium">Bill of Lading</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>BL Type</Label>
                <Select
                  value={formData.blType}
                  onValueChange={(v) => setFormData({ ...formData, blType: v as BLType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original">Original</SelectItem>
                    <SelectItem value="telex">Telex Release</SelectItem>
                    <SelectItem value="seaway">Seaway Bill</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="blDraft"
                  checked={formData.blDraftApproval}
                  onCheckedChange={(c) => setFormData({ ...formData, blDraftApproval: c as boolean })}
                />
                <Label htmlFor="blDraft">BL Draft Approved</Label>
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="finalBL"
                  checked={formData.finalBLIssued}
                  onCheckedChange={(c) => setFormData({ ...formData, finalBLIssued: c as boolean })}
                />
                <Label htmlFor="finalBL">Final BL Issued</Label>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium">Terminal & Shipping</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cutoff">Terminal Cutoff</Label>
                <Input
                  id="cutoff"
                  type="date"
                  value={formData.terminalCutoff}
                  onChange={(e) => setFormData({ ...formData, terminalCutoff: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gatein">Gate-in Terminal</Label>
                <Input
                  id="gatein"
                  type="date"
                  value={formData.gateInTerminal}
                  onChange={(e) => setFormData({ ...formData, gateInTerminal: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="etd">ETD</Label>
                <Input
                  id="etd"
                  type="date"
                  value={formData.etd}
                  onChange={(e) => setFormData({ ...formData, etd: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eta">ETA</Label>
                <Input
                  id="eta"
                  type="date"
                  value={formData.eta}
                  onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium">Delivery Order</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="arrivalNotice"
                  checked={formData.arrivalNoticeSent}
                  onCheckedChange={(c) => setFormData({ ...formData, arrivalNoticeSent: c as boolean })}
                />
                <Label htmlFor="arrivalNotice">Arrival Notice Sent</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="doIssued"
                  checked={formData.doIssued}
                  onCheckedChange={(c) => setFormData({ ...formData, doIssued: c as boolean })}
                />
                <Label htmlFor="doIssued">DO Issued</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doRelease">DO Release Date</Label>
                <Input
                  id="doRelease"
                  type="date"
                  value={formData.doReleaseDate}
                  onChange={(e) => setFormData({ ...formData, doReleaseDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="invoice">Total Invoice Amount ($)</Label>
            <Input
              id="invoice"
              type="number"
              min={0}
              value={formData.totalInvoiceAmount}
              onChange={(e) => setFormData({ ...formData, totalInvoiceAmount: parseFloat(e.target.value) || 0 })}
              placeholder="Enter invoice amount"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary">
              Save Progress
            </Button>
            <Button type="button" onClick={handleComplete}>
              Mark Complete
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
