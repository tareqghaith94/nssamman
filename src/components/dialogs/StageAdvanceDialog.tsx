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
import { ShipmentStage } from '@/types/shipment';
import { ArrowRight } from 'lucide-react';

interface StageAdvanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
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
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Advance Shipment Stage?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              You are about to move <strong className="text-foreground">{referenceId}</strong> to the next stage:
            </p>
            <div className="flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-muted/50">
              <span className="font-medium text-foreground">{stageLabels[currentStage]}</span>
              <ArrowRight className="w-5 h-5 text-primary" />
              <span className="font-medium text-primary">{stageLabels[targetStage]}</span>
            </div>
            <p className="text-muted-foreground text-sm">
              This action will lock the previous stage fields and move the shipment forward in the workflow.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Confirm Advance
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
