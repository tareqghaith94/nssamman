import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { Shipment } from '@/types/shipment';

interface ConfirmToOpsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (opsOwner: string) => void;
  referenceId: string;
  isLoading?: boolean;
  shipment?: Shipment;
}

const OPS_OWNERS = ['Uma', 'Rania', 'Mozayan'];

export function ConfirmToOpsDialog({
  open,
  onOpenChange,
  onConfirm,
  referenceId,
  isLoading,
  shipment,
}: ConfirmToOpsDialogProps) {
  const [opsOwner, setOpsOwner] = useState('');

  // Validate that cost and selling price are set
  const hasCost = shipment?.totalCost && shipment.totalCost > 0;
  const hasSellingPrice = shipment?.totalSellingPrice && shipment.totalSellingPrice > 0;
  const canProceed = hasCost && hasSellingPrice;

  const handleConfirm = () => {
    if (opsOwner && canProceed) {
      onConfirm(opsOwner);
    }
  };

  const getMissingFields = () => {
    const missing: string[] = [];
    if (!hasCost) missing.push('Cost');
    if (!hasSellingPrice) missing.push('Selling Price');
    return missing.join(' and ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Confirm to Operations</DialogTitle>
          <DialogDescription>
            Move <span className="font-mono font-medium text-foreground">{referenceId}</span> to the Operations stage.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!canProceed && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Cannot move to Operations: Missing {getMissingFields()}</span>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="opsOwner">Assign Ops Owner *</Label>
            <Select value={opsOwner} onValueChange={setOpsOwner}>
              <SelectTrigger>
                <SelectValue placeholder="Select ops owner" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {OPS_OWNERS.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!opsOwner || isLoading || !canProceed} className="gap-2">
            Confirm
            <ArrowRight className="w-4 h-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
