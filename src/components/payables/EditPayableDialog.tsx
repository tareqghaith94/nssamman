import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload, X, FileText, Loader2, Eye } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { ShipmentPayable, PartyType, PARTY_TYPE_LABELS } from '@/types/payable';
import { formatCurrency, Currency } from '@/lib/currency';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

interface EditPayableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payable: ShipmentPayable | null;
  shipmentInfo?: {
    portOfLoading: string;
    etd: string | null;
    eta: string | null;
  };
  onSubmit: (data: {
    id: string;
    partyType: PartyType;
    partyName: string;
    estimatedAmount: number | null;
    currency: string;
    notes: string | null;
    dueDate: string | null;
    // Invoice fields
    invoiceAmount?: number;
    invoiceFileName?: string;
    invoiceFilePath?: string;
    invoiceUploaded?: boolean;
    invoiceDate?: string;
  }) => void;
  onViewInvoice?: (filePath: string) => void;
}

export function EditPayableDialog({
  open,
  onOpenChange,
  payable,
  shipmentInfo,
  onSubmit,
  onViewInvoice,
}: EditPayableDialogProps) {
  const [partyType, setPartyType] = useState<PartyType>('agent');
  const [partyName, setPartyName] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [useCustomDueDate, setUseCustomDueDate] = useState(false);

  // Invoice fields
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingInvoicePath, setExistingInvoicePath] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate default due date based on shipment info
  const getDefaultDueDate = (): Date | undefined => {
    if (!shipmentInfo) return undefined;
    
    const isExport = shipmentInfo.portOfLoading.toLowerCase().includes('aqaba');
    
    if (isExport && shipmentInfo.etd) {
      return addDays(new Date(shipmentInfo.etd), 3);
    } else if (shipmentInfo.eta) {
      return subDays(new Date(shipmentInfo.eta), 10);
    }
    return undefined;
  };

  // Initialize form when payable changes
  useEffect(() => {
    if (payable) {
      setPartyType(payable.partyType);
      setPartyName(payable.partyName);
      setEstimatedAmount(payable.estimatedAmount?.toString() || '');
      setCurrency(payable.currency);
      setNotes(payable.notes || '');
      
      if (payable.dueDate) {
        setDueDate(new Date(payable.dueDate));
        setUseCustomDueDate(true);
      } else {
        setDueDate(getDefaultDueDate());
        setUseCustomDueDate(false);
      }

      // Invoice fields
      setInvoiceAmount(payable.invoiceAmount?.toString() || '');
      setFileName(payable.invoiceFileName || '');
      setExistingInvoicePath(payable.invoiceFilePath || null);
      setSelectedFile(null);
    }
  }, [payable, shipmentInfo]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setIsUploading(false);
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    setExistingInvoicePath(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!payable || !partyName.trim()) return;

    setIsUploading(true);
    try {
      let invoiceFilePath = existingInvoicePath;
      let invoiceFileName = fileName || payable.invoiceFileName;

      // Upload new file if selected
      if (selectedFile) {
        const timestamp = Date.now();
        const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${payable.id}/${timestamp}_${sanitizedFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('payable-invoices')
          .upload(filePath, selectedFile);

        if (uploadError) {
          throw uploadError;
        }

        invoiceFilePath = filePath;
        invoiceFileName = selectedFile.name;
      }

      const submitData: Parameters<typeof onSubmit>[0] = {
        id: payable.id,
        partyType,
        partyName: partyName.trim(),
        estimatedAmount: estimatedAmount ? parseFloat(estimatedAmount) : null,
        currency,
        notes: notes.trim() || null,
        dueDate: dueDate ? dueDate.toISOString() : null,
      };

      // Include invoice data if we have an invoice
      if (invoiceAmount && (invoiceFilePath || existingInvoicePath)) {
        submitData.invoiceAmount = parseFloat(invoiceAmount);
        submitData.invoiceFileName = invoiceFileName || undefined;
        submitData.invoiceFilePath = invoiceFilePath || undefined;
        submitData.invoiceUploaded = true;
        submitData.invoiceDate = new Date().toISOString();
      }

      onSubmit(submitData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving payable:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsUploading(false);
    }
  };

  const defaultDueDate = getDefaultDueDate();

  const invoiceDifference = invoiceAmount && estimatedAmount
    ? parseFloat(invoiceAmount) - parseFloat(estimatedAmount)
    : null;

  const hasExistingInvoice = existingInvoicePath && !selectedFile;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Payable</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Party Details Section */}
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
                {defaultDueDate && (
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
                        {!useCustomDueDate && (
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

          {/* Invoice Section */}
          <Separator />
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Invoice Details</h4>
            
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
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{fileName}</span>
                    {hasExistingInvoice && (
                      <span className="text-xs text-muted-foreground shrink-0">(current)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {hasExistingInvoice && onViewInvoice && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => onViewInvoice(existingInvoicePath!)}
                        className="h-8 w-8"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 w-8"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="h-8 w-8">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Invoice
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceAmount">Invoice Amount ({currency})</Label>
              <Input
                id="invoiceAmount"
                type="number"
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(e.target.value)}
                placeholder="0.00"
              />
              {invoiceDifference !== null && (
                <p className={cn(
                  "text-xs",
                  invoiceDifference > 0 ? 'text-destructive' : invoiceDifference < 0 ? 'text-green-600' : 'text-muted-foreground'
                )}>
                  {invoiceDifference > 0 ? '+' : ''}{formatCurrency(invoiceDifference, currency as Currency)} from estimate
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!partyName.trim() || isUploading}>
            {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isUploading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
