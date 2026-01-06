import { useState, useEffect } from 'react';
import { useShipments } from '@/hooks/useShipments';
import { useQuotations } from '@/hooks/useQuotations';
import { useCostLineItems } from '@/hooks/useCostLineItems';
import { useLockStore } from '@/store/lockStore';
import { useAuth } from '@/hooks/useAuth';
import { useTrackedShipmentActions } from '@/hooks/useTrackedShipmentActions';
import { canEditField, getFieldLockReason, canEditShipment } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Shipment } from '@/types/shipment';
import { Lock, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { LockedField } from '@/components/ui/LockedField';
import { UserRole } from '@/types/permissions';

const EQUIPMENT_OPTIONS = [
  { value: '20ft', label: "20' Standard" },
  { value: '40ft', label: "40' Standard" },
  { value: '40hc', label: "40' HC" },
  { value: '45ft', label: "45' HC" },
  { value: 'lcl', label: 'LCL' },
  { value: 'breakbulk', label: 'Breakbulk' },
  { value: 'airfreight', label: 'Air Freight' },
  { value: 'per_bl', label: 'Per BL' },
];

interface PricingFormProps {
  shipment: Shipment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LineItemInput {
  description: string;
  equipmentType: string;
  unitCost: number;
  quantity: number;
}

interface CostLineItemInput {
  description: string;
  equipmentType: string;
  unitCost: number;
  quantity: number;
}

export function PricingForm({ shipment, open, onOpenChange }: PricingFormProps) {
  const { updateShipment } = useShipments();
  const { quotations, createQuotation, updateQuotation, fetchLineItems, isCreating, isUpdating } = useQuotations();
  const { fetchCostLineItems, saveCostLineItems } = useCostLineItems();
  const { profile, roles } = useAuth();
  const { logActivity } = useTrackedShipmentActions();
  const { acquireLock, releaseLock } = useLockStore();
  
  const userRoles = (roles || []) as UserRole[];
  const userId = profile?.user_id || '';
  const refPrefix = profile?.ref_prefix || undefined;
  
  // Agent name state
  const [agent, setAgent] = useState('');
  
  // Cost line items for internal pricing
  const [costLineItems, setCostLineItems] = useState<CostLineItemInput[]>([]);
  
  // Line items state for client quotation
  const [lineItems, setLineItems] = useState<LineItemInput[]>([]);
  const [remarks, setRemarks] = useState('');
  const [validDays, setValidDays] = useState('30');
  
  // Existing quotation for this shipment
  const [existingQuotationId, setExistingQuotationId] = useState<string | null>(null);
  const [previousQuoteTotal, setPreviousQuoteTotal] = useState<number>(0);
  
  const [hasLock, setHasLock] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Check if shipment is editable
  const isEditable = shipment ? canEditShipment(shipment, userRoles, refPrefix) : false;
  
  // Field lock states based on role and stage
  const agentLocked = shipment ? !canEditField(shipment, 'agent', userRoles, refPrefix) : true;
  const pricingLocked = shipment ? !canEditField(shipment, 'costPerUnit', userRoles, refPrefix) : true;
  
  // Initialize cost line items from shipment equipment
  const initCostLineItemsFromShipment = () => {
    if (!shipment) return;
    
    const defaultDescription = shipment.modeOfTransport === 'air' ? 'Air Freight' : 'Ocean Freight';
    const items = shipment.equipment.map(eq => ({
      description: defaultDescription,
      equipmentType: eq.type,
      unitCost: shipment.costPerUnit || 0,
      quantity: eq.quantity,
    }));
    
    if (items.length === 0) {
      items.push({
        description: defaultDescription,
        equipmentType: '40hc',
        unitCost: 0,
        quantity: 1,
      });
    }
    
    setCostLineItems(items);
  };
  
  // Initialize selling line items from shipment equipment
  const initLineItemsFromShipment = () => {
    if (!shipment) return;
    
    const defaultDescription = shipment.modeOfTransport === 'air' ? 'Air Freight' : 'Ocean Freight';
    const items = shipment.equipment.map(eq => ({
      description: defaultDescription,
      equipmentType: eq.type,
      unitCost: shipment.sellingPricePerUnit || 0,
      quantity: eq.quantity,
    }));
    
    if (items.length === 0) {
      items.push({
        description: defaultDescription,
        equipmentType: '40hc',
        unitCost: 0,
        quantity: 1,
      });
    }
    
    setLineItems(items);
  };
  
  // Load shipment data and existing data
  useEffect(() => {
    if (shipment && open) {
      setAgent(shipment.agent || '');
      setRemarks('');
      setValidDays('30');
      
      // Load cost line items
      fetchCostLineItems(shipment.id).then((items) => {
        if (items.length > 0) {
          setCostLineItems(items.map(item => ({
            description: item.description,
            equipmentType: item.equipmentType || '',
            unitCost: item.unitCost,
            quantity: item.quantity,
          })));
        } else {
          initCostLineItemsFromShipment();
        }
      }).catch(() => {
        initCostLineItemsFromShipment();
      });
      
      // Check for existing quotation
      const existingQuote = quotations.find(q => q.shipmentId === shipment.id);
      
      if (existingQuote) {
        setExistingQuotationId(existingQuote.id);
        setRemarks(existingQuote.remarks || '');
        
        // Load line items from existing quotation
        fetchLineItems(existingQuote.id).then((items) => {
          if (items.length > 0) {
            setLineItems(items.map(item => ({
              description: item.description,
              equipmentType: item.equipmentType || '',
              unitCost: item.unitCost,
              quantity: item.quantity,
            })));
            const prevTotal = items.reduce((sum, item) => sum + (item.unitCost * item.quantity), 0);
            setPreviousQuoteTotal(prevTotal);
          } else {
            setPreviousQuoteTotal(0);
            initLineItemsFromShipment();
          }
        }).catch(() => {
          setPreviousQuoteTotal(0);
          initLineItemsFromShipment();
        });
      } else {
        setExistingQuotationId(null);
        setPreviousQuoteTotal(0);
        initLineItemsFromShipment();
      }
      
      // Try to acquire lock
      if (isEditable && userId) {
        const acquired = acquireLock(shipment.id, userId);
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
  }, [shipment?.id, open, quotations]);
  
  // Calculate totals
  const grandTotal = lineItems.reduce((sum, item) => sum + (item.unitCost * item.quantity), 0);
  const totalCost = costLineItems.reduce((sum, item) => sum + (item.unitCost * item.quantity), 0);
  const totalProfit = grandTotal - totalCost;
  const profitMargin = grandTotal > 0 ? (totalProfit / grandTotal * 100) : 0;
  
  // Cost line item handlers
  const addCostLineItem = () => {
    setCostLineItems([...costLineItems, { description: '', equipmentType: '', unitCost: 0, quantity: 1 }]);
  };
  
  const removeCostLineItem = (index: number) => {
    if (costLineItems.length > 1) {
      setCostLineItems(costLineItems.filter((_, i) => i !== index));
    }
  };
  
  const updateCostLineItem = (index: number, field: keyof CostLineItemInput, value: string | number) => {
    const updated = [...costLineItems];
    if (field === 'unitCost' || field === 'quantity') {
      updated[index][field] = typeof value === 'string' ? parseFloat(value) || 0 : value;
    } else {
      updated[index][field] = value as string;
    }
    setCostLineItems(updated);
  };
  
  // Selling line item handlers
  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', equipmentType: '', unitCost: 0, quantity: 1 }]);
  };
  
  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };
  
  const updateLineItem = (index: number, field: keyof LineItemInput, value: string | number) => {
    const updated = [...lineItems];
    if (field === 'unitCost' || field === 'quantity') {
      updated[index][field] = typeof value === 'string' ? parseFloat(value) || 0 : value;
    } else {
      updated[index][field] = value as string;
    }
    setLineItems(updated);
  };
  
  // Save pricing and create/update quotation
  const handleSaveAndIssue = async (status: 'draft' | 'issued') => {
    if (!shipment || !hasLock) return;
    
    if (lineItems.every(item => !item.description)) {
      toast.error('Please add at least one quotation line item');
      return;
    }
    
    if (costLineItems.every(item => !item.description)) {
      toast.error('Please add at least one cost line item');
      return;
    }
    
    setIsSaving(true);
    try {
      // Save cost line items
      await saveCostLineItems(
        shipment.id,
        costLineItems.filter(item => item.description).map(item => ({
          description: item.description,
          equipmentType: item.equipmentType || undefined,
          unitCost: item.unitCost,
          quantity: item.quantity,
        }))
      );
      
      // Save pricing summary to shipment
      await updateShipment(shipment.id, {
        agent,
        costPerUnit: costLineItems[0]?.unitCost || 0,
        sellingPricePerUnit: lineItems[0]?.unitCost || 0,
        profitPerUnit: (lineItems[0]?.unitCost || 0) - (costLineItems[0]?.unitCost || 0),
        totalSellingPrice: grandTotal,
        totalCost,
        totalProfit,
      });
      
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + parseInt(validDays));
      
      const lineItemsData = lineItems
        .filter(item => item.description)
        .map(item => ({
          description: item.description,
          equipmentType: item.equipmentType || undefined,
          unitCost: item.unitCost,
          quantity: item.quantity,
        }));
      
      const quotationData = {
        clientName: shipment.clientName || '',
        clientAddress: undefined,
        pol: shipment.portOfLoading,
        pod: shipment.portOfDischarge,
        modeOfTransport: shipment.modeOfTransport,
        equipment: [],
        remarks: remarks || undefined,
        status,
        validUntil,
        issuedAt: status === 'issued' ? new Date() : undefined,
        lineItems: lineItemsData,
      };
      
      if (existingQuotationId) {
        await updateQuotation({
          id: existingQuotationId,
          ...quotationData,
        });
        
        await logActivity(
          shipment.id,
          shipment.referenceId,
          'quotation_revised',
          `Quotation revised - new total: $${grandTotal.toLocaleString()}`,
          `$${previousQuoteTotal.toLocaleString()}`,
          `$${grandTotal.toLocaleString()}`
        );
        
        if (status === 'issued') {
          await logActivity(
            shipment.id,
            shipment.referenceId,
            'quotation_issued',
            `Quotation issued for $${grandTotal.toLocaleString()}`
          );
        }
        
        toast.success(status === 'issued' ? 'Quotation updated & issued' : 'Draft saved');
      } else {
        await createQuotation({
          shipmentId: shipment.id,
          ...quotationData,
        });
        
        await logActivity(
          shipment.id,
          shipment.referenceId,
          'quotation_created',
          `Quotation created with total $${grandTotal.toLocaleString()}`
        );
        
        if (status === 'issued') {
          await logActivity(
            shipment.id,
            shipment.referenceId,
            'quotation_issued',
            `Quotation issued for $${grandTotal.toLocaleString()}`
          );
        }
        
        toast.success(status === 'issued' ? 'Quotation issued' : 'Draft saved');
      }
      
      releaseLock(shipment.id);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to save quotation');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleClose = () => {
    if (shipment) {
      releaseLock(shipment.id);
    }
    onOpenChange(false);
  };
  
  if (!shipment) return null;
  
  const isReadOnly = !isEditable || !hasLock;
  const isLoading = isCreating || isUpdating || isSaving;
  
  // Render line items table (shared between cost and selling)
  const renderLineItemsTable = (
    items: (LineItemInput | CostLineItemInput)[],
    onUpdate: (index: number, field: keyof LineItemInput, value: string | number) => void,
    onRemove: (index: number) => void,
    isCost: boolean = false
  ) => (
    <div className="border rounded-md overflow-hidden">
      <div className="grid grid-cols-[1fr_120px_100px_60px_90px_40px] bg-muted/50 text-xs font-medium">
        <div className="p-2 border-r border-border">Description</div>
        <div className="p-2 border-r border-border">Type</div>
        <div className="p-2 border-r border-border text-right">{isCost ? 'Cost ($)' : 'Rate ($)'}</div>
        <div className="p-2 border-r border-border text-center">Qty</div>
        <div className="p-2 border-r border-border text-right">Amount</div>
        <div className="p-2"></div>
      </div>
      {items.map((item, idx) => (
        <div key={idx} className="grid grid-cols-[1fr_120px_100px_60px_90px_40px] border-t border-border">
          <Input
            value={item.description}
            onChange={(e) => onUpdate(idx, 'description', e.target.value)}
            placeholder={isCost ? "Agent Freight" : "Ocean Freight"}
            className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-sm"
            disabled={isReadOnly || (isCost && pricingLocked)}
          />
          <Select 
            value={item.equipmentType} 
            onValueChange={(v) => onUpdate(idx, 'equipmentType', v)}
            disabled={isReadOnly || (isCost && pricingLocked)}
          >
            <SelectTrigger className="border-0 border-l border-border rounded-none h-9 focus:ring-0 focus:ring-offset-0 text-sm">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              {EQUIPMENT_OPTIONS.map((eq) => (
                <SelectItem key={eq.value} value={eq.value}>
                  {eq.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            value={item.unitCost || ''}
            onChange={(e) => onUpdate(idx, 'unitCost', e.target.value)}
            placeholder="0"
            className="border-0 border-l border-border rounded-none text-right focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-sm"
            disabled={isReadOnly || (isCost && pricingLocked)}
          />
          <Input
            type="number"
            value={item.quantity || ''}
            onChange={(e) => onUpdate(idx, 'quantity', e.target.value)}
            className="border-0 border-l border-border rounded-none text-center focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-sm"
            min={1}
            disabled={isReadOnly || (isCost && pricingLocked)}
          />
          <div className="flex items-center justify-end border-l border-border px-2 text-sm font-medium bg-muted/30">
            ${(item.unitCost * item.quantity).toLocaleString()}
          </div>
          <button
            type="button"
            onClick={() => onRemove(idx)}
            className="flex items-center justify-center text-muted-foreground hover:text-destructive border-l border-border h-9"
            disabled={items.length === 1 || isReadOnly || (isCost && pricingLocked)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      {/* Total Row */}
      <div className="grid grid-cols-[1fr_120px_100px_60px_90px_40px] border-t-2 border-border bg-muted/50">
        <div className="col-span-4 p-2 text-right font-semibold text-sm">TOTAL</div>
        <div className="p-2 text-right font-bold border-l border-border">
          ${items.reduce((sum, item) => sum + (item.unitCost * item.quantity), 0).toLocaleString()}
        </div>
        <div className="border-l border-border"></div>
      </div>
    </div>
  );
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            Pricing & Quote for {shipment.referenceId}
            {existingQuotationId && (
              <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">
                Quote exists
              </span>
            )}
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
        
        <div className="space-y-5">
          {/* Shipment Info Header */}
          <div className="p-4 rounded-lg bg-muted/50 text-sm grid grid-cols-2 gap-2">
            <p><span className="text-muted-foreground">Route:</span> {shipment.portOfLoading} → {shipment.portOfDischarge}</p>
            <p><span className="text-muted-foreground">Client:</span> {shipment.clientName || '-'}</p>
            <p><span className="text-muted-foreground">Equipment:</span> {shipment.equipment?.map((eq) => `${eq.type?.toUpperCase()} × ${eq.quantity}`).join(', ') || '-'}</p>
            <p><span className="text-muted-foreground">Salesperson:</span> {shipment.salesperson}</p>
          </div>
          
          {/* Agent */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Internal Pricing</h4>
            <LockedField 
              isLocked={agentLocked} 
              lockReason={getFieldLockReason('agent', userRoles, shipment)}
            >
              <div className="space-y-2">
                <Label htmlFor="agent">Agent Name</Label>
                <Input
                  id="agent"
                  value={agent}
                  onChange={(e) => setAgent(e.target.value)}
                  placeholder="Enter agent name"
                  disabled={isReadOnly || agentLocked}
                  className="max-w-sm"
                />
              </div>
            </LockedField>
          </div>
          
          {/* Cost Breakdown Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Cost Breakdown</h4>
              <button
                type="button"
                onClick={addCostLineItem}
                className="text-sm text-primary hover:underline flex items-center gap-1"
                disabled={isReadOnly || pricingLocked}
              >
                <Plus className="h-3 w-3" /> Add cost
              </button>
            </div>
            
            <LockedField 
              isLocked={pricingLocked} 
              lockReason={getFieldLockReason('costPerUnit', userRoles, shipment)}
            >
              {renderLineItemsTable(costLineItems, updateCostLineItem, removeCostLineItem, true)}
            </LockedField>
          </div>
          
          {/* Client Quotation Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Client Quotation</h4>
              <button
                type="button"
                onClick={addLineItem}
                className="text-sm text-primary hover:underline flex items-center gap-1"
                disabled={isReadOnly}
              >
                <Plus className="h-3 w-3" /> Add line
              </button>
            </div>
            
            {renderLineItemsTable(lineItems, updateLineItem, removeLineItem, false)}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validDays">Valid for (days)</Label>
                <Input
                  id="validDays"
                  type="number"
                  value={validDays}
                  onChange={(e) => setValidDays(e.target.value)}
                  className="w-24"
                  disabled={isReadOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Special notes..."
                  rows={2}
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>
          
          {/* Profit Summary */}
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <h4 className="font-medium text-sm mb-3">Profit Summary</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Selling</p>
                <p className="font-semibold text-lg">${grandTotal.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Cost</p>
                <p className="font-semibold text-lg">${totalCost.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Profit</p>
                <p className={`font-semibold text-lg ${totalProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  ${totalProfit.toLocaleString()} ({profitMargin.toFixed(1)}%)
                </p>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isReadOnly && (
              <>
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => handleSaveAndIssue('draft')} 
                  disabled={isLoading}
                >
                  Save Draft
                </Button>
                <Button 
                  type="button" 
                  onClick={() => handleSaveAndIssue('issued')} 
                  disabled={isLoading}
                >
                  {existingQuotationId ? 'Update & Issue' : 'Save & Issue'}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
