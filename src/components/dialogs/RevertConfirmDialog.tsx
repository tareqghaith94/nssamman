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

interface RevertConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  currentStage: ShipmentStage;
  previousStage: ShipmentStage;
  referenceId: string;
}

export function RevertConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  currentStage,
  previousStage,
  referenceId,
}: RevertConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revert Shipment Stage?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to move <strong>{referenceId}</strong> back to{' '}
              <strong className="capitalize">{previousStage}</strong>?
            </p>
            <p className="text-muted-foreground">
              This will unlock the shipment for editing in the {previousStage} stage.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirm Revert</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
