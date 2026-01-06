import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ShipmentStage } from '@/types/shipment';
import { ArrowRight } from 'lucide-react';

const OPS_OWNERS = ['Uma', 'Rania', 'Mozayan'] as const;

interface StageAdvanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (opsOwner?: string) => void;
  currentStage: ShipmentStage;
  targetStage: ShipmentStage;
  referenceId: string;
}

const stageLabels: Record<ShipmentStage, string> = {
  lead: 'Lead',
  pricing: 'Pricing',
  operations: 'Operations',
  completed: 'Completed',
};

export function StageAdvanceDialog({
  open,
  onOpenChange,
  onConfirm,
  currentStage,
  targetStage,
  referenceId,
}: StageAdvanceDialogProps) {
  const [selectedOpsOwner, setSelectedOpsOwner] = useState<string>('');
  
  // Require ops owner when moving to operations stage
  const requiresOpsOwner = targetStage === 'operations';
  const canConfirm = !requiresOpsOwner || selectedOpsOwner;

  const handleConfirm = () => {
    onConfirm(requiresOpsOwner ? selectedOpsOwner : undefined);
    setSelectedOpsOwner(''); // Reset for next use
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedOpsOwner(''); // Reset on close
    }
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Advance Shipment Stage?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4" asChild>
            <div>
              <p>
                You are about to move <strong className="text-foreground">{referenceId}</strong> to the next stage:
              </p>
              <div className="flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-muted/50">
                <span className="font-medium text-foreground">{stageLabels[currentStage]}</span>
                <ArrowRight className="w-5 h-5 text-primary" />
                <span className="font-medium text-primary">{stageLabels[targetStage]}</span>
              </div>
              
              {requiresOpsOwner && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="opsOwner" className="text-foreground">
                    Assign Operations Owner *
                  </Label>
                  <Select value={selectedOpsOwner} onValueChange={setSelectedOpsOwner}>
                    <SelectTrigger id="opsOwner">
                      <SelectValue placeholder="Select ops owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPS_OWNERS.map((owner) => (
                        <SelectItem key={owner} value={owner}>
                          {owner}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    The assigned owner will be responsible for tracking this shipment.
                  </p>
                </div>
              )}
              
              <p className="text-muted-foreground text-sm pt-2">
                This action will lock the previous stage fields and move the shipment forward in the workflow.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={!canConfirm}>
            Confirm Advance
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
