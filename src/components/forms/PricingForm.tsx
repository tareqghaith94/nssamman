import { useState, useEffect } from 'react';
import { useShipmentStore } from '@/store/shipmentStore';
import { useLockStore } from '@/store/lockStore';
import { useUserStore } from '@/store/userStore';
import { useTrackedShipmentActions } from '@/hooks/useTrackedShipmentActions';
import { canEditField, getFieldLockReason, canEditShipment, canAdvanceStage } from '@/lib/permissions';
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
import { XCircle, Lock, AlertTriangle } from 'lucide-react';
import { LockedField } from '@/components/ui/LockedField';

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
  const currentUser = useUserStore((s) => s.currentUser);
  const { trackMoveToStage, logActivity } = useTrackedShipmentActions();
  const { acquireLock, releaseLock, getLocker } = useLockStore();
  
  const [formData, setFormData] = useState({
    agent: '',
    sellingPricePerUnit: 0,
    costPerUnit: 0,
  });
  
  const [showLostForm, setShowLostForm] = useState(false);
  const [lostReason, setLostReason] = useState<LostReason | ''>('');
  const [hasLock, setHasLock] = useState(false);
  
  // Check if shipment is editable
  const isEditable = shipment ? canEditShipment(shipment, currentUser.role, currentUser.refPrefix) : false;
  
  // Field lock states based on role and stage
  const agentLocked = shipment ? !canEditField(shipment, 'agent', currentUser.role, currentUser.refPrefix) : true;
  const pricingLocked = shipment ? !canEditField(shipment, 'sellingPricePerUnit', currentUser.role, currentUser.refPrefix) : true;
  
  useEffect(() => {
    if (shipment && open) {
      setFormData({
        agent: shipment.agent || '',
        sellingPricePerUnit: shipment.sellingPricePerUnit || 0,
        costPerUnit: shipment.costPerUnit || 0,
      });
      setShowLostForm(false);
      setLostReason('');
      
      // Try to acquire lock
      if (isEditable) {
        const acquired = acquireLock(shipment.id, currentUser.id);
        setHasLock(acquired);
        if (!acquired) {
          toast.warning(`This shipment is being edited by another user`);
        }
      }
    }
    
    return () => {
      if (shipment) {
        releaseLock(shipment.id);
      }
    };
  }, [shipment, open]);
  
  const profitPerUnit = formData.sellingPricePerUnit - formData.costPerUnit;
  const totalQuantity = shipment?.equipment?.reduce((sum, eq) => sum + eq.quantity, 0) || 1;
  const totalSellingPrice = formData.sellingPricePerUnit * totalQuantity;
  const totalCost = formData.costPerUnit * totalQuantity;
  const totalProfit = profitPerUnit * totalQuantity;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shipment || !hasLock) return;
    
    updateShipment(shipment.id, {
      ...formData,
      profitPerUnit,
      totalSellingPrice,
      totalCost,
      totalProfit,
    });
    
    toast.success('Pricing updated successfully');
    releaseLock(shipment.id);
    onOpenChange(false);
  };
  
  const handleConfirm = () => {
    if (!shipment || !hasLock || !canAdvanceStage(currentUser.role, 'pricing')) return;
    
    updateShipment(shipment.id, {
      ...formData,
      profitPerUnit,
      totalSellingPrice,
      totalCost,
      totalProfit,
    });
    
    trackMoveToStage(shipment, 'confirmed');
    toast.success('Shipment confirmed and moved to Confirmed stage');
    releaseLock(shipment.id);
    onOpenChange(false);
  };
  
  const handleMarkAsLost = () => {
    if (!shipment || !lostReason || !hasLock) return;
    
    updateShipment(shipment.id, {
      isLost: true,
      lostReason: lostReason as LostReason,
      lostAt: new Date(),
    });
    
    logActivity(shipment.id, shipment.referenceId, 'marked_lost', `Marked as lost: ${lostReason}`);
    toast.success('Shipment marked as lost');
    releaseLock(shipment.id);
    onOpenChange(false);
  };
  
  const handleClose = () => {
    if (shipment) {
      releaseLock(shipment.id);
    }
    onOpenChange(false);
  };
  
  if (!shipment) return null;
  
  const isReadOnly = !isEditable || !hasLock;
  const canConfirm = canAdvanceStage(currentUser.role, 'pricing');
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            Pricing for {shipment.referenceId}
            {isReadOnly && (
              <span className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
                <Lock className="w-4 h-4" />
                Read Only
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {isReadOnly && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>
              {!isEditable 
                ? 'This shipment cannot be edited'
                : 'This shipment is being edited by another user'
              }
            </span>
          </div>
        )}
        
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
                  disabled={!lostReason || isReadOnly}
                >
                  Confirm Lost
                </Button>
              </div>
            </div>
          ) : (
            <>
              <LockedField 
                isLocked={agentLocked} 
                lockReason={shipment ? getFieldLockReason('agent', currentUser.role, shipment) : undefined}
              >
                <div className="space-y-2">
                  <Label htmlFor="agent">Agent Name</Label>
                  <Input
                    id="agent"
                    value={formData.agent}
                    onChange={(e) => setFormData({ ...formData, agent: e.target.value })}
                    placeholder="Enter agent name"
                    disabled={isReadOnly || agentLocked}
                  />
                </div>
              </LockedField>
              
              <div className="grid grid-cols-2 gap-4">
                <LockedField 
                  isLocked={pricingLocked} 
                  lockReason={shipment ? getFieldLockReason('sellingPricePerUnit', currentUser.role, shipment) : undefined}
                >
                  <div className="space-y-2">
                    <Label htmlFor="selling">Selling Price/Unit ($)</Label>
                    <Input
                      id="selling"
                      type="number"
                      min={0}
                      value={formData.sellingPricePerUnit}
                      onChange={(e) => setFormData({ ...formData, sellingPricePerUnit: parseFloat(e.target.value) || 0 })}
                      disabled={isReadOnly || pricingLocked}
                    />
                  </div>
                </LockedField>
                <LockedField 
                  isLocked={pricingLocked} 
                  lockReason={shipment ? getFieldLockReason('costPerUnit', currentUser.role, shipment) : undefined}
                >
                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost/Unit ($)</Label>
                    <Input
                      id="cost"
                      type="number"
                      min={0}
                      value={formData.costPerUnit}
                      onChange={(e) => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) || 0 })}
                      disabled={isReadOnly || pricingLocked}
                    />
                  </div>
                </LockedField>
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
                {!isReadOnly && (currentUser.role === 'admin' || currentUser.role === 'pricing') && (
                  <Button type="button" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setShowLostForm(true)}>
                    Mark as Lost
                  </Button>
                )}
                <div className="flex gap-3 ml-auto">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    {isReadOnly ? 'Close' : 'Cancel'}
                  </Button>
                  {!isReadOnly && !pricingLocked && (
                    <Button type="submit" variant="secondary">
                      Save Draft
                    </Button>
                  )}
                  {!isReadOnly && canConfirm && (
                    <Button type="button" onClick={handleConfirm}>
                      Confirm Quote
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
