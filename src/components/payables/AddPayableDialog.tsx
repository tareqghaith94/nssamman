import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PartyType, PARTY_TYPE_LABELS } from '@/types/payable';

interface AddPayableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipmentId: string;
  referenceId: string;
  onSubmit: (data: {
    shipmentId: string;
    partyType: PartyType;
    partyName: string;
    estimatedAmount?: number;
    currency?: string;
    notes?: string;
  }) => void;
}

export function AddPayableDialog({
  open,
  onOpenChange,
  shipmentId,
  referenceId,
  onSubmit,
}: AddPayableDialogProps) {
  const [partyType, setPartyType] = useState<PartyType>('agent');
  const [partyName, setPartyName] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!partyName.trim()) return;

    onSubmit({
      shipmentId,
      partyType,
      partyName: partyName.trim(),
      estimatedAmount: estimatedAmount ? parseFloat(estimatedAmount) : undefined,
      currency,
      notes: notes.trim() || undefined,
    });

    // Reset form
    setPartyType('agent');
    setPartyName('');
    setEstimatedAmount('');
    setCurrency('USD');
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Payable Party</DialogTitle>
        </DialogHeader>
        
        <div className="text-sm text-muted-foreground mb-4">
          Shipment: <span className="font-medium text-foreground">{referenceId}</span>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="partyType">Party Type</Label>
            <Select value={partyType} onValueChange={(v) => setPartyType(v as PartyType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PARTY_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="partyName">Party Name</Label>
            <Input
              id="partyName"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              placeholder="e.g., CMA CGM, Maersk, ABC Trucking"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedAmount">Estimated Amount</Label>
              <Input
                id="estimatedAmount"
                type="number"
                value={estimatedAmount}
                onChange={(e) => setEstimatedAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="JOD">JOD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!partyName.trim()}>
            Add Payable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
