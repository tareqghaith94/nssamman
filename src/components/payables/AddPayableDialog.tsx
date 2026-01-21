import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { PartyType, PARTY_TYPE_LABELS } from '@/types/payable';

interface AddPayableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipmentId: string;
  referenceId: string;
  shipmentInfo?: {
    portOfLoading: string;
    etd: string | null;
    eta: string | null;
  };
  onSubmit: (data: {
    shipmentId: string;
    partyType: PartyType;
    partyName: string;
    estimatedAmount?: number;
    currency?: string;
    notes?: string;
    dueDate?: string;
  }) => void;
}

export function AddPayableDialog({
  open,
  onOpenChange,
  shipmentId,
  referenceId,
  shipmentInfo,
  onSubmit,
}: AddPayableDialogProps) {
  const [partyType, setPartyType] = useState<PartyType>('agent');
  const [partyName, setPartyName] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [useCustomDueDate, setUseCustomDueDate] = useState(false);

  // Calculate default due date based on shipment info
  const defaultDueDate = useMemo((): Date | undefined => {
    if (!shipmentInfo) return undefined;
    
    const isExport = shipmentInfo.portOfLoading.toLowerCase().includes('aqaba');
    
    if (isExport && shipmentInfo.etd) {
      return addDays(new Date(shipmentInfo.etd), 3);
    } else if (shipmentInfo.eta) {
      return subDays(new Date(shipmentInfo.eta), 10);
    }
    return undefined;
  }, [shipmentInfo]);

  // Set default due date when dialog opens
  useEffect(() => {
    if (open) {
      setDueDate(defaultDueDate);
      setUseCustomDueDate(false);
    }
  }, [open, defaultDueDate]);

  const handleSubmit = () => {
    if (!partyName.trim()) return;

    onSubmit({
      shipmentId,
      partyType,
      partyName: partyName.trim(),
      estimatedAmount: estimatedAmount ? parseFloat(estimatedAmount) : undefined,
      currency,
      notes: notes.trim() || undefined,
      dueDate: dueDate ? dueDate.toISOString() : undefined,
    });

    // Reset form
    setPartyType('agent');
    setPartyName('');
    setEstimatedAmount('');
    setCurrency('USD');
    setNotes('');
    setDueDate(undefined);
    setUseCustomDueDate(false);
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

          {/* Due Date Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Due Date</Label>
              {defaultDueDate && useCustomDueDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-muted-foreground"
                  onClick={() => {
                    setUseCustomDueDate(false);
                    setDueDate(defaultDueDate);
                  }}
                >
                  Reset to auto
                </Button>
              )}
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? (
                    <span>
                      {format(dueDate, "PPP")}
                      {!useCustomDueDate && defaultDueDate && (
                        <span className="ml-2 text-muted-foreground text-xs">(auto)</span>
                      )}
                    </span>
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => {
                    setDueDate(date);
                    setUseCustomDueDate(true);
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              {useCustomDueDate 
                ? "Custom due date set" 
                : defaultDueDate 
                  ? "Calculated from shipment schedule (ETD+3 or ETA-10)"
                  : "No schedule available for auto-calculation"
              }
            </p>
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
