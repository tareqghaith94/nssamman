import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shipment, Currency } from '@/types/shipment';
import { useCollectionPayments } from '@/hooks/useCollectionPayments';
import { formatCurrency } from '@/lib/currency';
import { format } from 'date-fns';
import { Trash2, Plus, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { useShipments } from '@/hooks/useShipments';

interface PartialPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: Shipment;
}

const PAYMENT_METHODS = ['Bank Transfer', 'Check', 'Cash', 'Credit Card', 'Other'];

export function PartialPaymentDialog({
  open,
  onOpenChange,
  shipment,
}: PartialPaymentDialogProps) {
  const { payments, totalCollected, addPayment, deletePayment, isAdding } = useCollectionPayments(shipment.id);
  const { updateShipment } = useShipments();
  
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>(shipment.currency || 'USD');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [notes, setNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const totalInvoice = shipment.totalInvoiceAmount || 0;
  const remaining = totalInvoice - totalCollected;
  const progressPercent = totalInvoice > 0 ? (totalCollected / totalInvoice) * 100 : 0;

  const handleAddPayment = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    await addPayment({
      shipmentId: shipment.id,
      amount: numAmount,
      currency,
      paymentDate: new Date(paymentDate),
      paymentMethod,
      notes: notes || undefined,
    });

    // Update amount_collected on shipment
    const newTotal = totalCollected + numAmount;
    await updateShipment(shipment.id, {
      amountCollected: newTotal,
      // Mark as fully collected if amount matches or exceeds invoice
      paymentCollected: newTotal >= totalInvoice,
      paymentCollectedDate: newTotal >= totalInvoice ? new Date() : undefined,
    });

    toast.success('Payment recorded');
    setAmount('');
    setNotes('');
  };

  const handleDeletePayment = async (paymentId: string, paymentAmount: number) => {
    await deletePayment(paymentId);
    
    // Update amount_collected on shipment
    const newTotal = Math.max(0, totalCollected - paymentAmount);
    await updateShipment(shipment.id, {
      amountCollected: newTotal,
      paymentCollected: newTotal >= totalInvoice,
      paymentCollectedDate: newTotal >= totalInvoice ? new Date() : null,
    });

    toast.success('Payment removed');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Collection Payments - {shipment.referenceId}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Summary */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Collected</span>
              <span className="font-medium">
                {formatCurrency(totalCollected, shipment.currency)} / {formatCurrency(totalInvoice, shipment.currency)}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progressPercent.toFixed(0)}% collected</span>
              <span>Remaining: {formatCurrency(remaining, shipment.currency)}</span>
            </div>
          </div>

          {/* Payment History */}
          {payments.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Payment History</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {formatCurrency(payment.amount, payment.currency)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(payment.paymentDate, 'dd MMM yyyy')} • {payment.paymentMethod}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeletePayment(payment.id, payment.amount)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Payment */}
          <div className="space-y-3 pt-2 border-t">
            <Label className="text-xs text-muted-foreground">Record New Payment</Label>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-9"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Currency</Label>
                <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment reference, check number, etc."
                rows={2}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleAddPayment} disabled={isAdding || !amount}>
            <Plus className="w-4 h-4 mr-1" />
            Add Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
