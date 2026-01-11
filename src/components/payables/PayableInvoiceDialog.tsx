import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { PayableWithShipment, ShipmentPayable } from '@/types/payable';
import { PayableTypeBadge } from './PayableTypeBadge';
import { Currency, formatCurrency } from '@/lib/currency';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PayableInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payable: PayableWithShipment | ShipmentPayable | null;
  onSubmit: (data: {
    id: string;
    invoiceAmount: number;
    invoiceFileName: string;
    invoiceFilePath: string;
    invoiceUploaded: boolean;
    invoiceDate: string;
  }) => void;
}

export function PayableInvoiceDialog({
  open,
  onOpenChange,
  payable,
  onSubmit,
}: PayableInvoiceDialogProps) {
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setFileName(file.name);
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setFileName('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!payable || !invoiceAmount || !selectedFile) return;

    setIsUploading(true);
    try {
      // Generate unique file path
      const timestamp = Date.now();
      const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${payable.id}/${timestamp}_${sanitizedFileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('payable-invoices')
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw uploadError;
      }

      // Call onSubmit with the file path
      onSubmit({
        id: payable.id,
        invoiceAmount: parseFloat(invoiceAmount),
        invoiceFileName: selectedFile.name,
        invoiceFilePath: filePath,
        invoiceUploaded: true,
        invoiceDate: new Date().toISOString(),
      });

      // Reset form
      setFileName('');
      setSelectedFile(null);
      setInvoiceAmount('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error uploading invoice:', error);
      toast.error('Failed to upload invoice');
    } finally {
      setIsUploading(false);
    }
  };

  if (!payable) return null;

  const difference = invoiceAmount && payable.estimatedAmount
    ? parseFloat(invoiceAmount) - payable.estimatedAmount
    : null;

  // Check if payable has reference ID (PayableWithShipment)
  const referenceId = 'referenceId' in payable ? payable.referenceId : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Invoice</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-2 text-sm">
          {referenceId && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Reference:</span>
              <span className="font-medium">{referenceId}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Party:</span>
            <div className="flex items-center gap-2">
              <PayableTypeBadge type={payable.partyType} />
              <span className="font-medium">{payable.partyName}</span>
            </div>
          </div>
          {payable.estimatedAmount && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Estimated Cost:</span>
              <span className="font-medium">
                {formatCurrency(payable.estimatedAmount, payable.currency as Currency)}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Invoice File</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {fileName ? (
              <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate max-w-[200px]">{fileName}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={handleRemoveFile}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoiceAmount">Invoice Amount ({payable.currency})</Label>
            <Input
              id="invoiceAmount"
              type="number"
              value={invoiceAmount}
              onChange={(e) => setInvoiceAmount(e.target.value)}
              placeholder="0.00"
            />
            {difference !== null && (
              <p className={`text-xs ${difference > 0 ? 'text-destructive' : difference < 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                {difference > 0 ? '+' : ''}{formatCurrency(difference, payable.currency as Currency)} from estimate
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!fileName || !invoiceAmount || isUploading}
          >
            {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isUploading ? 'Uploading...' : 'Save Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}