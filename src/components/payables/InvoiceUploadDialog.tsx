import { useState, useRef } from 'react';
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
import { Upload, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { Shipment } from '@/types/shipment';

interface InvoiceUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: Shipment;
  onSubmit: (data: {
    agentInvoiceUploaded: boolean;
    agentInvoiceFileName: string;
    agentInvoiceAmount: number;
    agentInvoiceDate: Date;
  }) => void;
}

export function InvoiceUploadDialog({
  open,
  onOpenChange,
  shipment,
  onSubmit,
}: InvoiceUploadDialogProps) {
  const [fileName, setFileName] = useState<string | null>(
    shipment.agentInvoiceFileName || null
  );
  const [invoiceAmount, setInvoiceAmount] = useState<string>(
    shipment.agentInvoiceAmount?.toString() || ''
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      // Check file type
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        toast.error('Only PDF, PNG, and JPG files are allowed');
        return;
      }
      setFileName(file.name);
    }
  };

  const handleRemoveFile = () => {
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    if (!fileName) {
      toast.error('Please upload an invoice file');
      return;
    }
    
    const amount = parseFloat(invoiceAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid invoice amount');
      return;
    }

    onSubmit({
      agentInvoiceUploaded: true,
      agentInvoiceFileName: fileName,
      agentInvoiceAmount: amount,
      agentInvoiceDate: new Date(),
    });

    onOpenChange(false);
    toast.success('Invoice uploaded successfully');
  };

  const amountDifference = invoiceAmount
    ? parseFloat(invoiceAmount) - (shipment.totalCost || 0)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Agent Invoice</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reference Info */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            <p className="text-sm text-muted-foreground">Reference ID</p>
            <p className="font-mono font-medium text-primary">{shipment.referenceId}</p>
            <p className="text-sm text-muted-foreground mt-2">Agent</p>
            <p className="font-medium">{shipment.agent}</p>
          </div>

          {/* Estimated Amount */}
          <div className="rounded-lg border border-border/50 p-3">
            <p className="text-sm text-muted-foreground">Estimated Cost</p>
            <p className="text-lg font-semibold">${shipment.totalCost?.toLocaleString()}</p>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Invoice File</Label>
            {fileName ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
                <FileText className="w-5 h-5 text-primary" />
                <span className="flex-1 text-sm truncate">{fileName}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleRemoveFile}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed border-border/50 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload PDF, PNG, or JPG
                </p>
                <p className="text-xs text-muted-foreground">Max 5MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Invoice Amount */}
          <div className="space-y-2">
            <Label htmlFor="invoiceAmount">Invoice Amount ($)</Label>
            <Input
              id="invoiceAmount"
              type="number"
              min="0"
              step="0.01"
              placeholder="Enter actual invoice amount"
              value={invoiceAmount}
              onChange={(e) => setInvoiceAmount(e.target.value)}
            />
            {invoiceAmount && parseFloat(invoiceAmount) !== shipment.totalCost && (
              <p className={`text-xs ${amountDifference > 0 ? 'text-destructive' : 'text-success'}`}>
                {amountDifference > 0 ? '+' : ''}${amountDifference.toLocaleString()} from estimate
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Save Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
