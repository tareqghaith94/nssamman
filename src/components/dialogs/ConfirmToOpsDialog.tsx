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
import { ArrowRight } from 'lucide-react';

interface ConfirmToOpsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (opsOwner: string) => void;
  referenceId: string;
  isLoading?: boolean;
}

const OPS_OWNERS = ['Uma', 'Rania', 'Mozayan'];

export function ConfirmToOpsDialog({
  open,
  onOpenChange,
  onConfirm,
  referenceId,
  isLoading,
}: ConfirmToOpsDialogProps) {
  const [opsOwner, setOpsOwner] = useState('');

  const handleConfirm = () => {
    if (opsOwner) {
      onConfirm(opsOwner);
    }
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
          <Button onClick={handleConfirm} disabled={!opsOwner || isLoading} className="gap-2">
            Confirm
            <ArrowRight className="w-4 h-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
