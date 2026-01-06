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
import { XCircle } from 'lucide-react';
import { LostReason } from '@/types/shipment';

interface MarkLostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: LostReason) => void;
  referenceId: string;
  isLoading?: boolean;
}

const LOST_REASONS: { value: LostReason; label: string }[] = [
  { value: 'price', label: 'Price too high' },
  { value: 'competitor', label: 'Lost to competitor' },
  { value: 'cancelled', label: 'Customer cancelled' },
  { value: 'timing', label: 'Schedule/timing issue' },
  { value: 'requirements', label: 'Service requirements not met' },
  { value: 'no_response', label: 'No response from customer' },
  { value: 'other', label: 'Other' },
];

export function MarkLostDialog({
  open,
  onOpenChange,
  onConfirm,
  referenceId,
  isLoading,
}: MarkLostDialogProps) {
  const [reason, setReason] = useState<LostReason | ''>('');

  const handleConfirm = () => {
    if (reason) {
      onConfirm(reason);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2 text-destructive">
            <XCircle className="w-5 h-5" />
            Mark as Lost
          </DialogTitle>
          <DialogDescription>
            Mark <span className="font-mono font-medium text-foreground">{referenceId}</span> as a lost opportunity.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="lostReason">Reason for Loss *</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as LostReason)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {LOST_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
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
          <Button variant="destructive" onClick={handleConfirm} disabled={!reason || isLoading}>
            Confirm Lost
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
