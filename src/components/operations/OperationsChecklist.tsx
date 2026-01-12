import { useState, useEffect, useMemo } from 'react';
import { useShipments } from '@/hooks/useShipments';
import { useLockStore } from '@/store/lockStore';
import { useAuth } from '@/hooks/useAuth';
import { useTrackedShipmentActions } from '@/hooks/useTrackedShipmentActions';
import { canAdvanceStage, canRevertStage, getPreviousStage } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Progress } from '@/components/ui/progress';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { RevertConfirmDialog } from '@/components/dialogs/RevertConfirmDialog';
import { toast } from 'sonner';
import { Shipment, BLType, Currency } from '@/types/shipment';
import { format } from 'date-fns';
import { CalendarIcon, Lock, AlertTriangle, ChevronDown, Check, RotateCcw, Save, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types/permissions';

interface OperationsChecklistProps {
  shipment: Shipment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  nssBookingReference: string;
  nssInvoiceNumber: string;
  blType: BLType | '';
  blDraftApproval: boolean;
  finalBLIssued: boolean;
  terminalCutoff: string;
  gateInTerminal: string;
  etd: string;
  eta: string;
  arrivalNoticeSent: boolean;
  doIssued: boolean;
  doReleaseDate: string;
  totalInvoiceAmount: number;
  invoiceCurrency: Currency;
}

export function OperationsChecklist({ shipment, open, onOpenChange }: OperationsChecklistProps) {
  const { updateShipment } = useShipments();
  const { profile, roles } = useAuth();
  const { trackMoveToStage, trackRevertStage } = useTrackedShipmentActions();
  const { acquireLock, releaseLock } = useLockStore();
  
  const userRoles = (roles || []) as UserRole[];
  const userId = profile?.user_id || '';
  
  const [formData, setFormData] = useState<FormData>({
    nssBookingReference: '',
    nssInvoiceNumber: '',
    blType: '',
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
    invoiceCurrency: 'USD',
  });
  
  const [originalData, setOriginalData] = useState<FormData | null>(null);
  const [hasLock, setHasLock] = useState(false);
  const [showRevertDialog, setShowRevertDialog] = useState(false);
  const [openSections, setOpenSections] = useState({
    shipping: true,
    bl: true,
    delivery: true,
    booking: true,
    invoicing: true,
  });

  // Calculate section completion
  const sectionCompletion = useMemo(() => ({
    shipping: !!(formData.terminalCutoff && formData.gateInTerminal && formData.etd && formData.eta),
    bl: !!(formData.blType && formData.blDraftApproval && formData.finalBLIssued),
    delivery: !!(formData.arrivalNoticeSent && formData.doIssued && formData.doReleaseDate),
    booking: !!(formData.nssBookingReference && formData.nssInvoiceNumber),
    invoicing: !!formData.totalInvoiceAmount,
  }), [formData]);

  const overallProgress = useMemo(() => {
    const sections = Object.values(sectionCompletion);
    const completed = sections.filter(Boolean).length;
    return Math.round((completed / sections.length) * 100);
  }, [sectionCompletion]);

  // Check if form has changes
  const hasChanges = useMemo(() => {
    if (!originalData) return false;
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  }, [formData, originalData]);

  useEffect(() => {
    if (shipment && open) {
      const data: FormData = {
        nssBookingReference: shipment.nssBookingReference || '',
        nssInvoiceNumber: shipment.nssInvoiceNumber || '',
        blType: (shipment.blType || '') as BLType | '',
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
        invoiceCurrency: shipment.invoiceCurrency || 'USD',
      };
      setFormData(data);
      setOriginalData(data);
      
      if (userId) {
        const acquired = acquireLock(shipment.id, userId);
        setHasLock(acquired);
        if (!acquired) {
          toast.warning('This shipment is being edited by another user');
        }
      }
    }
    
    return () => {
      if (shipment) {
        releaseLock(shipment.id);
      }
    };
  }, [shipment, open, userId, acquireLock, releaseLock]);
  
  const handleReset = () => {
    if (originalData) {
      setFormData(originalData);
      toast.info('Changes discarded');
    }
  };

  const handleSubmit = () => {
    if (!shipment || !hasLock) return;
    
    updateShipment(shipment.id, {
      nssBookingReference: formData.nssBookingReference || undefined,
      nssInvoiceNumber: formData.nssInvoiceNumber || undefined,
      blType: formData.blType || undefined,
      blDraftApproval: formData.blDraftApproval,
      finalBLIssued: formData.finalBLIssued,
      terminalCutoff: formData.terminalCutoff ? new Date(formData.terminalCutoff) : undefined,
      gateInTerminal: formData.gateInTerminal ? new Date(formData.gateInTerminal) : undefined,
      etd: formData.etd ? new Date(formData.etd) : undefined,
      eta: formData.eta ? new Date(formData.eta) : undefined,
      arrivalNoticeSent: formData.arrivalNoticeSent,
      doIssued: formData.doIssued,
      doReleaseDate: formData.doReleaseDate ? new Date(formData.doReleaseDate) : undefined,
      totalInvoiceAmount: formData.totalInvoiceAmount || undefined,
      invoiceCurrency: formData.invoiceCurrency,
    });
    
    setOriginalData(formData);
    toast.success('Operations updated');
  };
  
  const handleComplete = () => {
    if (!shipment || !hasLock || !canAdvanceStage(userRoles, 'operations')) return;
    
    // Validate required fields before completing
    const missingFields: string[] = [];
    
    if (!formData.doReleaseDate) {
      missingFields.push('DO Release Date');
    }
    if (!formData.nssInvoiceNumber) {
      missingFields.push('NSS Invoice Number');
    }
    if (!formData.totalInvoiceAmount) {
      missingFields.push('Total Invoice Amount');
    }
    
    if (missingFields.length > 0) {
      toast.error(`Cannot complete: Missing ${missingFields.join(', ')}`);
      return;
    }
    
    handleSubmit();
    trackMoveToStage(shipment, 'completed');
    toast.success('Shipment marked as completed');
    releaseLock(shipment.id);
    onOpenChange(false);
  };
  
  const handleRevert = async () => {
    if (!shipment) return;
    const previousStage = getPreviousStage(shipment.stage);
    if (!previousStage) return;
    
    await trackRevertStage(shipment, previousStage);
    toast.success(`${shipment.referenceId} reverted to ${previousStage}`);
    setShowRevertDialog(false);
    onOpenChange(false);
  };
  
  const handleClose = () => {
    if (shipment) {
      releaseLock(shipment.id);
    }
    onOpenChange(false);
  };
  
  if (!shipment) return null;
  
  const isReadOnly = !hasLock;
  const canComplete = canAdvanceStage(userRoles, 'operations');
  const canRevert = canRevertStage(userRoles, shipment.stage);

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const SectionHeader = ({ 
    title, 
    section, 
    isComplete 
  }: { 
    title: string; 
    section: keyof typeof openSections; 
    isComplete: boolean;
  }) => (
    <CollapsibleTrigger asChild>
      <button
        onClick={() => toggleSection(section)}
        className={cn(
          "w-full flex items-center justify-between p-3 rounded-lg transition-colors",
          "hover:bg-muted/50",
          isComplete ? "bg-green-500/10" : "bg-muted/30"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-6 w-6 rounded-full flex items-center justify-center",
            isComplete ? "bg-green-500 text-white" : "bg-muted-foreground/20"
          )}>
            {isComplete ? <Check className="h-4 w-4" /> : null}
          </div>
          <span className="font-medium">{title}</span>
        </div>
        <ChevronDown className={cn(
          "h-5 w-5 transition-transform",
          openSections[section] && "rotate-180"
        )} />
      </button>
    </CollapsibleTrigger>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            Operations: {shipment.referenceId}
            {isReadOnly && (
              <span className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
                <Lock className="w-4 h-4" />
                Read Only
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Completion Progress</span>
            <span className="font-medium">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
        
        {isReadOnly && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>This shipment is being edited by another user</span>
          </div>
        )}

        {/* Route Info */}
        <div className="p-3 rounded-lg bg-muted/50 text-sm">
          <span className="text-muted-foreground">Route:</span> {shipment.portOfLoading} → {shipment.portOfDischarge}
          {shipment.agent && (
            <span className="ml-4"><span className="text-muted-foreground">Agent:</span> {shipment.agent}</span>
          )}
        </div>
        
        <div className="space-y-3">
          {/* Shipping Schedule Section - First priority: ETD/ETA */}
          <Collapsible open={openSections.shipping} onOpenChange={() => toggleSection('shipping')}>
            <SectionHeader title="Shipping Schedule" section="shipping" isComplete={sectionCompletion.shipping} />
            <CollapsibleContent className="pt-3 pl-9 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'etd', label: 'ETD' },
                  { key: 'eta', label: 'ETA' },
                  { key: 'terminalCutoff', label: 'Terminal Cutoff' },
                  { key: 'gateInTerminal', label: 'Gate-in Terminal' },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <Label>{label}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData[key as keyof FormData] && "text-muted-foreground"
                          )}
                          disabled={isReadOnly}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData[key as keyof FormData] 
                            ? format(new Date(formData[key as keyof FormData] as string), "PPP") 
                            : <span>Pick a date</span>
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData[key as keyof FormData] ? new Date(formData[key as keyof FormData] as string) : undefined}
                          onSelect={(date) => setFormData({ 
                            ...formData, 
                            [key]: date ? format(date, 'yyyy-MM-dd') : '' 
                          })}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Bill of Lading Section */}
          <Collapsible open={openSections.bl} onOpenChange={() => toggleSection('bl')}>
            <SectionHeader title="Bill of Lading" section="bl" isComplete={sectionCompletion.bl} />
            <CollapsibleContent className="pt-3 pl-9 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>BL Type</Label>
                  <Select
                    value={formData.blType}
                    onValueChange={(v) => setFormData({ ...formData, blType: v as BLType })}
                    disabled={isReadOnly}
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
                <div className="flex items-center space-x-2 pt-8">
                  <Checkbox
                    id="blDraft"
                    checked={formData.blDraftApproval}
                    onCheckedChange={(c) => setFormData({ ...formData, blDraftApproval: c as boolean })}
                    disabled={isReadOnly}
                  />
                  <Label htmlFor="blDraft">BL Draft Approved</Label>
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Checkbox
                    id="finalBL"
                    checked={formData.finalBLIssued}
                    onCheckedChange={(c) => setFormData({ ...formData, finalBLIssued: c as boolean })}
                    disabled={isReadOnly}
                  />
                  <Label htmlFor="finalBL">Final BL Issued</Label>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Delivery Section */}
          <Collapsible open={openSections.delivery} onOpenChange={() => toggleSection('delivery')}>
            <SectionHeader title="Delivery" section="delivery" isComplete={sectionCompletion.delivery} />
            <CollapsibleContent className="pt-3 pl-9 space-y-4">
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="arrivalNotice"
                    checked={formData.arrivalNoticeSent}
                    onCheckedChange={(c) => setFormData({ ...formData, arrivalNoticeSent: c as boolean })}
                    disabled={isReadOnly}
                  />
                  <Label htmlFor="arrivalNotice">Arrival Notice Sent</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="doIssued"
                    checked={formData.doIssued}
                    onCheckedChange={(c) => setFormData({ ...formData, doIssued: c as boolean })}
                    disabled={isReadOnly}
                  />
                  <Label htmlFor="doIssued">DO Issued</Label>
                </div>
              </div>
              <div className="space-y-2 max-w-xs">
                <Label>DO Release Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.doReleaseDate && "text-muted-foreground"
                      )}
                      disabled={isReadOnly}
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
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Booking Section - Moved above Invoicing */}
          <Collapsible open={openSections.booking} onOpenChange={() => toggleSection('booking')}>
            <SectionHeader title="Booking" section="booking" isComplete={sectionCompletion.booking} />
            <CollapsibleContent className="pt-3 pl-9 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nssBooking">NSS Booking Reference</Label>
                  <Input
                    id="nssBooking"
                    value={formData.nssBookingReference}
                    onChange={(e) => setFormData({ ...formData, nssBookingReference: e.target.value })}
                    placeholder="Enter booking reference"
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nssInvoice">NSS Invoice Number</Label>
                  <Input
                    id="nssInvoice"
                    value={formData.nssInvoiceNumber}
                    onChange={(e) => setFormData({ ...formData, nssInvoiceNumber: e.target.value })}
                    placeholder="Enter invoice number"
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Invoicing Section */}
          <Collapsible open={openSections.invoicing} onOpenChange={() => toggleSection('invoicing')}>
            <SectionHeader title="Invoicing" section="invoicing" isComplete={sectionCompletion.invoicing} />
            <CollapsibleContent className="pt-3 pl-9 space-y-4">
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={formData.invoiceCurrency}
                    onValueChange={(v) => setFormData({ ...formData, invoiceCurrency: v as Currency })}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="JOD">JOD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceAmount">Total Invoice Amount ({formData.invoiceCurrency})</Label>
                  <Input
                    id="invoiceAmount"
                    type="number"
                    value={formData.totalInvoiceAmount || ''}
                    onChange={(e) => setFormData({ ...formData, totalInvoiceAmount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2">
            {canRevert && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowRevertDialog(true)}
                className="gap-1"
              >
                <RotateCcw className="h-4 w-4" />
                Revert
              </Button>
            )}
            {hasChanges && !isReadOnly && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
              >
                Discard Changes
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isReadOnly && (
              <>
                <Button onClick={handleSubmit} disabled={!hasChanges} className="gap-1">
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                {canComplete && (
                  <Button variant="secondary" onClick={handleComplete} className="gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Mark Complete
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
        
        <RevertConfirmDialog
          open={showRevertDialog}
          onOpenChange={setShowRevertDialog}
          onConfirm={handleRevert}
          currentStage={shipment.stage}
          previousStage={getPreviousStage(shipment.stage) || 'pricing'}
          referenceId={shipment.referenceId}
        />
      </DialogContent>
    </Dialog>
  );
}
