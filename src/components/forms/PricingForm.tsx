import { useState, useEffect } from 'react';
import { useShipmentStore } from '@/store/shipmentStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Shipment, LostReason } from '@/types/shipment';
import { XCircle } from 'lucide-react';

const LOST_REASONS: { value: LostReason; label: string }[] = [
  { value: 'price', label: 'Price too high' },
  { value: 'competitor', label: 'Lost to competitor' },
  { value: 'cancelled', label: 'Customer cancelled' },
  { value: 'timing', label: 'Schedule/timing issue' },
  { value: 'requirements', label: 'Service requirements not met' },
  { value: 'no_response', label: 'No response from customer' },
  { value: 'other', label: 'Other' },
];

interface PricingFormProps {
  shipment: Shipment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PricingForm({ shipment, open, onOpenChange }: PricingFormProps) {
  const updateShipment = useShipmentStore((s) => s.updateShipment);
  const moveToStage = useShipmentStore((s) => s.moveToStage);
  
  const [formData, setFormData] = useState({
    agent: '',
    sellingPricePerUnit: 0,
    costPerUnit: 0,
  });
  
  const [showLostForm, setShowLostForm] = useState(false);
  const [lostReason, setLostReason] = useState<LostReason | ''>('');
  
  useEffect(() => {
    if (shipment) {
      setFormData({
        agent: shipment.agent || '',
        sellingPricePerUnit: shipment.sellingPricePerUnit || 0,
        costPerUnit: shipment.costPerUnit || 0,
      });
      setShowLostForm(false);
      setLostReason('');
    }
  }, [shipment]);
  
  const profitPerUnit = formData.sellingPricePerUnit - formData.costPerUnit;
  const totalQuantity = shipment?.equipment?.reduce((sum, eq) => sum + eq.quantity, 0) || 1;
  const totalSellingPrice = formData.sellingPricePerUnit * totalQuantity;
  const totalCost = formData.costPerUnit * totalQuantity;
  const totalProfit = profitPerUnit * totalQuantity;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shipment) return;
    
    updateShipment(shipment.id, {
      ...formData,
      profitPerUnit,
      totalSellingPrice,
      totalCost,
      totalProfit,
    });
    
    toast.success('Pricing updated successfully');
    onOpenChange(false);
  };
  
  const handleConfirm = () => {
    if (!shipment) return;
    
    updateShipment(shipment.id, {
      ...formData,
      profitPerUnit,
      totalSellingPrice,
      totalCost,
      totalProfit,
    });
    
    moveToStage(shipment.id, 'confirmed');
    toast.success('Shipment confirmed and moved to Confirmed stage');
    onOpenChange(false);
  };
  
  const handleMarkAsLost = () => {
    if (!shipment || !lostReason) return;
    
    updateShipment(shipment.id, {
      isLost: true,
      lostReason: lostReason as LostReason,
      lostAt: new Date(),
    });
    
    toast.success('Shipment marked as lost');
    onOpenChange(false);
  };
  
  if (!shipment) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">
            Pricing for {shipment.referenceId}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="p-4 rounded-lg bg-muted/50 text-sm space-y-1">
            <p><span className="text-muted-foreground">Route:</span> {shipment.portOfLoading} → {shipment.portOfDischarge}</p>
            <p><span className="text-muted-foreground">Equipment:</span> {shipment.equipment?.map((eq, i) => `${eq.type?.toUpperCase()} × ${eq.quantity}`).join(', ') || '-'}</p>
          </div>
          
          {showLostForm ? (
            <div className="space-y-4 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="w-5 h-5" />
                <h4 className="font-medium">Mark as Lost</h4>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lostReason">Reason for Loss</Label>
                <Select value={lostReason} onValueChange={(v) => setLostReason(v as LostReason)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOST_REASONS.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowLostForm(false)}>
                  Back
                </Button>
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleMarkAsLost}
                  disabled={!lostReason}
                >
                  Confirm Lost
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="agent">Agent Name</Label>
                <Input
                  id="agent"
                  value={formData.agent}
                  onChange={(e) => setFormData({ ...formData, agent: e.target.value })}
                  placeholder="Enter agent name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="selling">Selling Price/Unit ($)</Label>
                  <Input
                    id="selling"
                    type="number"
                    min={0}
                    value={formData.sellingPricePerUnit}
                    onChange={(e) => setFormData({ ...formData, sellingPricePerUnit: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost/Unit ($)</Label>
                  <Input
                    id="cost"
                    type="number"
                    min={0}
                    value={formData.costPerUnit}
                    onChange={(e) => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <h4 className="font-medium text-sm mb-3">Calculated Values</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Profit/Unit</p>
                    <p className="font-semibold text-lg">${profitPerUnit.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Selling</p>
                    <p className="font-semibold text-lg">${totalSellingPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Cost</p>
                    <p className="font-semibold text-lg">${totalCost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Profit</p>
                    <p className="font-semibold text-lg text-success">${totalProfit.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setShowLostForm(true)}>
                  Mark as Lost
                </Button>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="secondary">
                    Save Draft
                  </Button>
                  <Button type="button" onClick={handleConfirm}>
                    Confirm Quote
                  </Button>
                </div>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
