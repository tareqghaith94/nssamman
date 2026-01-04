import { useState, useEffect } from 'react';
import { useShipmentStore } from '@/store/shipmentStore';
import { useLockStore } from '@/store/lockStore';
import { useUserStore } from '@/store/userStore';
import { canEditField, getFieldLockReason, canEditShipment, canAdvanceStage } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Shipment, BLType } from '@/types/shipment';
import { format } from 'date-fns';
import { CalendarIcon, Lock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LockedField } from '@/components/ui/LockedField';

interface OperationsFormProps {
  shipment: Shipment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OperationsForm({ shipment, open, onOpenChange }: OperationsFormProps) {
  const updateShipment = useShipmentStore((s) => s.updateShipment);
  const moveToStage = useShipmentStore((s) => s.moveToStage);
  const currentUser = useUserStore((s) => s.currentUser);
  const { acquireLock, releaseLock } = useLockStore();
  
  const [formData, setFormData] = useState({
    nssBookingReference: '',
    nssInvoiceNumber: '',
    blType: '' as BLType,
    blDraftApproval: false,
    finalBLIssued: false,
    terminalCutoff: '',
    gateInTerminal: '',
    etd: '',
    eta: '',
    arrivalNoticeSent: false,
    doIssued: false,
    doReleaseDate: '',
    totalInvoiceAmount: 0,
  });
  
  const [hasLock, setHasLock] = useState(false);
  
  // Check if shipment is editable
  const isEditable = shipment ? canEditShipment(shipment, currentUser.role, currentUser.refPrefix) : false;
  
  // Field lock states based on role
  const bookingRefLocked = shipment ? !canEditField(shipment, 'nssBookingReference', currentUser.role, currentUser.refPrefix) : true;
  const blTypeLocked = shipment ? !canEditField(shipment, 'blType', currentUser.role, currentUser.refPrefix) : true;
  const etdLocked = shipment ? !canEditField(shipment, 'etd', currentUser.role, currentUser.refPrefix) : true;
  
  useEffect(() => {
    if (shipment && open) {
      setFormData({
        nssBookingReference: shipment.nssBookingReference || '',
        nssInvoiceNumber: shipment.nssInvoiceNumber || '',
        blType: shipment.blType || '' as BLType,
        blDraftApproval: shipment.blDraftApproval || false,
        finalBLIssued: shipment.finalBLIssued || false,
        terminalCutoff: shipment.terminalCutoff ? format(new Date(shipment.terminalCutoff), 'yyyy-MM-dd') : '',
        gateInTerminal: shipment.gateInTerminal ? format(new Date(shipment.gateInTerminal), 'yyyy-MM-dd') : '',
        etd: shipment.etd ? format(new Date(shipment.etd), 'yyyy-MM-dd') : '',
        eta: shipment.eta ? format(new Date(shipment.eta), 'yyyy-MM-dd') : '',
        arrivalNoticeSent: shipment.arrivalNoticeSent || false,
        doIssued: shipment.doIssued || false,
        doReleaseDate: shipment.doReleaseDate ? format(new Date(shipment.doReleaseDate), 'yyyy-MM-dd') : '',
        totalInvoiceAmount: shipment.totalInvoiceAmount || 0,
      });
      
      // Try to acquire lock
      if (isEditable) {
        const acquired = acquireLock(shipment.id, currentUser.id);
        setHasLock(acquired);
        if (!acquired) {
          toast.warning(`This shipment is being edited by another user`);
        }
      }
    }
    
    return () => {
      if (shipment) {
        releaseLock(shipment.id);
      }
    };
  }, [shipment, open]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shipment || !hasLock) return;
    
    updateShipment(shipment.id, {
      nssBookingReference: formData.nssBookingReference,
      nssInvoiceNumber: formData.nssInvoiceNumber,
      blType: formData.blType,
      blDraftApproval: formData.blDraftApproval,
      finalBLIssued: formData.finalBLIssued,
      terminalCutoff: formData.terminalCutoff ? new Date(formData.terminalCutoff) : undefined,
      gateInTerminal: formData.gateInTerminal ? new Date(formData.gateInTerminal) : undefined,
      etd: formData.etd ? new Date(formData.etd) : undefined,
      eta: formData.eta ? new Date(formData.eta) : undefined,
      arrivalNoticeSent: formData.arrivalNoticeSent,
      doIssued: formData.doIssued,
      doReleaseDate: formData.doReleaseDate ? new Date(formData.doReleaseDate) : undefined,
      totalInvoiceAmount: formData.totalInvoiceAmount,
    });
    
    toast.success('Operations updated successfully');
    releaseLock(shipment.id);
    onOpenChange(false);
  };
  
  const handleComplete = () => {
    if (!shipment || !hasLock || !canAdvanceStage(currentUser.role, 'operations')) return;
    
    if (!formData.totalInvoiceAmount) {
      toast.error('Please enter the total invoice amount before completing');
      return;
    }
    
    updateShipment(shipment.id, {
      nssBookingReference: formData.nssBookingReference,
      nssInvoiceNumber: formData.nssInvoiceNumber,
      blType: formData.blType,
      blDraftApproval: formData.blDraftApproval,
      finalBLIssued: formData.finalBLIssued,
      terminalCutoff: formData.terminalCutoff ? new Date(formData.terminalCutoff) : undefined,
      gateInTerminal: formData.gateInTerminal ? new Date(formData.gateInTerminal) : undefined,
      etd: formData.etd ? new Date(formData.etd) : undefined,
      eta: formData.eta ? new Date(formData.eta) : undefined,
      arrivalNoticeSent: formData.arrivalNoticeSent,
      doIssued: formData.doIssued,
      doReleaseDate: formData.doReleaseDate ? new Date(formData.doReleaseDate) : undefined,
      totalInvoiceAmount: formData.totalInvoiceAmount,
    });
    
    moveToStage(shipment.id, 'completed');
    toast.success('Shipment marked as completed');
    releaseLock(shipment.id);
    onOpenChange(false);
  };
  
  const handleClose = () => {
    if (shipment) {
      releaseLock(shipment.id);
    }
    onOpenChange(false);
  };
  
  if (!shipment) return null;
  
  const isReadOnly = !isEditable || !hasLock;
  const canComplete = canAdvanceStage(currentUser.role, 'operations');
  const allFieldsLocked = bookingRefLocked && blTypeLocked && etdLocked;
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            Operations for {shipment.referenceId}
            {isReadOnly && (
              <span className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
                <Lock className="w-4 h-4" />
                Read Only
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {isReadOnly && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>
              {!isEditable 
                ? 'This shipment cannot be edited'
                : 'This shipment is being edited by another user'
              }
            </span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="p-4 rounded-lg bg-muted/50 text-sm space-y-1">
            <p><span className="text-muted-foreground">Route:</span> {shipment.portOfLoading} → {shipment.portOfDischarge}</p>
            <p><span className="text-muted-foreground">Agent:</span> {shipment.agent}</p>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium">Reference Numbers</h4>
            <div className="grid grid-cols-2 gap-4">
              <LockedField 
                isLocked={bookingRefLocked} 
                lockReason={shipment ? getFieldLockReason('nssBookingReference', currentUser.role, shipment) : undefined}
              >
                <div className="space-y-2">
                  <Label htmlFor="nssBooking">NSS Booking Reference</Label>
                  <Input
                    id="nssBooking"
                    value={formData.nssBookingReference}
                    onChange={(e) => setFormData({ ...formData, nssBookingReference: e.target.value })}
                    placeholder="Enter booking reference"
                    disabled={isReadOnly || bookingRefLocked}
                  />
                </div>
              </LockedField>
              <LockedField 
                isLocked={bookingRefLocked} 
                lockReason={shipment ? getFieldLockReason('nssInvoiceNumber', currentUser.role, shipment) : undefined}
              >
                <div className="space-y-2">
                  <Label htmlFor="nssInvoice">NSS Invoice Number</Label>
                  <Input
                    id="nssInvoice"
                    value={formData.nssInvoiceNumber}
                    onChange={(e) => setFormData({ ...formData, nssInvoiceNumber: e.target.value })}
                    placeholder="Enter invoice number"
                    disabled={isReadOnly || bookingRefLocked}
                  />
                </div>
              </LockedField>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium">Bill of Lading</h4>
            <div className="grid grid-cols-3 gap-4">
              <LockedField 
                isLocked={blTypeLocked} 
                lockReason={shipment ? getFieldLockReason('blType', currentUser.role, shipment) : undefined}
              >
                <div className="space-y-2">
                  <Label>BL Type</Label>
                  <Select
                    value={formData.blType}
                    onValueChange={(v) => setFormData({ ...formData, blType: v as BLType })}
                    disabled={isReadOnly || blTypeLocked}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="original">Original</SelectItem>
                      <SelectItem value="telex">Telex Release</SelectItem>
                      <SelectItem value="seaway">Seaway Bill</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </LockedField>
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="blDraft"
                  checked={formData.blDraftApproval}
                  onCheckedChange={(c) => setFormData({ ...formData, blDraftApproval: c as boolean })}
                  disabled={isReadOnly || blTypeLocked}
                />
                <Label htmlFor="blDraft">BL Draft Approved</Label>
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="finalBL"
                  checked={formData.finalBLIssued}
                  onCheckedChange={(c) => setFormData({ ...formData, finalBLIssued: c as boolean })}
                  disabled={isReadOnly || blTypeLocked}
                />
                <Label htmlFor="finalBL">Final BL Issued</Label>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium">Terminal & Shipping</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Terminal Cutoff</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.terminalCutoff && "text-muted-foreground"
                      )}
                      disabled={isReadOnly || etdLocked}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.terminalCutoff ? format(new Date(formData.terminalCutoff), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.terminalCutoff ? new Date(formData.terminalCutoff) : undefined}
                      onSelect={(date) => setFormData({ ...formData, terminalCutoff: date ? format(date, 'yyyy-MM-dd') : '' })}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Gate-in Terminal</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.gateInTerminal && "text-muted-foreground"
                      )}
                      disabled={isReadOnly || etdLocked}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.gateInTerminal ? format(new Date(formData.gateInTerminal), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.gateInTerminal ? new Date(formData.gateInTerminal) : undefined}
                      onSelect={(date) => setFormData({ ...formData, gateInTerminal: date ? format(date, 'yyyy-MM-dd') : '' })}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>ETD</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.etd && "text-muted-foreground"
                      )}
                      disabled={isReadOnly || etdLocked}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.etd ? format(new Date(formData.etd), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.etd ? new Date(formData.etd) : undefined}
                      onSelect={(date) => setFormData({ ...formData, etd: date ? format(date, 'yyyy-MM-dd') : '' })}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>ETA</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.eta && "text-muted-foreground"
                      )}
                      disabled={isReadOnly || etdLocked}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.eta ? format(new Date(formData.eta), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.eta ? new Date(formData.eta) : undefined}
                      onSelect={(date) => setFormData({ ...formData, eta: date ? format(date, 'yyyy-MM-dd') : '' })}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium">Delivery Order</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="arrivalNotice"
                  checked={formData.arrivalNoticeSent}
                  onCheckedChange={(c) => setFormData({ ...formData, arrivalNoticeSent: c as boolean })}
                  disabled={isReadOnly || etdLocked}
                />
                <Label htmlFor="arrivalNotice">Arrival Notice Sent</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="doIssued"
                  checked={formData.doIssued}
                  onCheckedChange={(c) => setFormData({ ...formData, doIssued: c as boolean })}
                  disabled={isReadOnly || etdLocked}
                />
                <Label htmlFor="doIssued">DO Issued</Label>
              </div>
              <div className="space-y-2">
                <Label>DO Release Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.doReleaseDate && "text-muted-foreground"
                      )}
                      disabled={isReadOnly || etdLocked}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.doReleaseDate ? format(new Date(formData.doReleaseDate), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.doReleaseDate ? new Date(formData.doReleaseDate) : undefined}
                      onSelect={(date) => setFormData({ ...formData, doReleaseDate: date ? format(date, 'yyyy-MM-dd') : '' })}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium">Invoice</h4>
            <div className="space-y-2">
              <Label htmlFor="invoiceAmount">Total Invoice Amount ($)</Label>
              <Input
                id="invoiceAmount"
                type="number"
                min={0}
                value={formData.totalInvoiceAmount}
                onChange={(e) => setFormData({ ...formData, totalInvoiceAmount: parseFloat(e.target.value) || 0 })}
                disabled={isReadOnly || etdLocked}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isReadOnly && !allFieldsLocked && (
              <Button type="submit" variant="secondary">
                Save Progress
              </Button>
            )}
            {!isReadOnly && canComplete && (
              <Button type="button" onClick={handleComplete}>
                Mark Complete
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
