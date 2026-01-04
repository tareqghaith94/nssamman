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
import { toast } from 'sonner';
import { Shipment } from '@/types/shipment';

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
  
  useEffect(() => {
    if (shipment) {
      setFormData({
        agent: shipment.agent || '',
        sellingPricePerUnit: shipment.sellingPricePerUnit || 0,
        costPerUnit: shipment.costPerUnit || 0,
      });
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
          
          <div className="flex justify-end gap-3 pt-4">
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
