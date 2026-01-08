import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTrackedShipmentActions } from '@/hooks/useTrackedShipmentActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Trash2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Shipment, EquipmentType, ModeOfTransport, PaymentTerms, Incoterm, EquipmentItem } from '@/types/shipment';
import { INCOTERMS, getLocationOptions } from '@/lib/ports';
import { SALESPERSON_REF_PREFIX, UserRole } from '@/types/permissions';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { ClientNameCombobox } from '@/components/ui/ClientNameCombobox';

const SALESPEOPLE = Object.keys(SALESPERSON_REF_PREFIX) as readonly string[];
const PRICING_OWNERS = ['Uma', 'Rania', 'Mozayan'] as const;

interface LeadEditFormProps {
  shipment: Shipment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  salesperson: string;
  clientName: string;
  portOfLoading: string;
  portOfDischarge: string;
  equipment: EquipmentItem[];
  modeOfTransport: ModeOfTransport;
  paymentTerms: PaymentTerms;
  incoterm: Incoterm;
  pricingOwner: string;
}

function shipmentToFormData(shipment: Shipment): FormData {
  return {
    salesperson: shipment.salesperson,
    clientName: shipment.clientName || '',
    portOfLoading: shipment.portOfLoading,
    portOfDischarge: shipment.portOfDischarge,
    equipment: shipment.equipment && shipment.equipment.length > 0 
      ? shipment.equipment 
      : [{ type: '' as EquipmentType, quantity: 1 }],
    modeOfTransport: shipment.modeOfTransport,
    paymentTerms: shipment.paymentTerms,
    incoterm: shipment.incoterm,
    pricingOwner: shipment.pricingOwner || '',
  };
}

export function LeadEditForm({ shipment, open, onOpenChange }: LeadEditFormProps) {
  const { trackUpdateShipment } = useTrackedShipmentActions();
  const { profile, roles } = useAuth();
  
  const userRoles = (roles || []) as UserRole[];
  const canEditSalesperson = userRoles.some(role => ['admin', 'pricing', 'ops'].includes(role));
  
  const [formData, setFormData] = useState<FormData>({
    salesperson: '',
    clientName: '',
    portOfLoading: '',
    portOfDischarge: '',
    equipment: [{ type: '' as EquipmentType, quantity: 1 }],
    modeOfTransport: 'sea',
    paymentTerms: '' as PaymentTerms,
    incoterm: '' as Incoterm,
    pricingOwner: '',
  });
  
  const [originalData, setOriginalData] = useState<FormData | null>(null);
  
  // Initialize form when shipment changes or dialog opens
  useEffect(() => {
    if (open && shipment) {
      const data = shipmentToFormData(shipment);
      setFormData(data);
      setOriginalData(data);
    }
  }, [open, shipment]);
  
  const locationOptions = getLocationOptions(formData.modeOfTransport);
  
  // Check if form has changes
  const hasChanges = useMemo(() => {
    if (!originalData) return false;
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  }, [formData, originalData]);
  
  // Reset ports when mode changes (only if ports don't exist in new mode)
  useEffect(() => {
    const options = getLocationOptions(formData.modeOfTransport);
    const polValid = options.includes(formData.portOfLoading as typeof options[number]);
    const podValid = options.includes(formData.portOfDischarge as typeof options[number]);
    
    if (!polValid || !podValid) {
      setFormData(prev => ({
        ...prev,
        portOfLoading: polValid ? prev.portOfLoading : '',
        portOfDischarge: podValid ? prev.portOfDischarge : '',
      }));
    }
  }, [formData.modeOfTransport]);
  
  const addEquipment = () => {
    if (formData.equipment.length < 3) {
      setFormData({
        ...formData,
        equipment: [...formData.equipment, { type: '' as EquipmentType, quantity: 1 }],
      });
    }
  };
  
  const removeEquipment = (index: number) => {
    if (formData.equipment.length > 1) {
      setFormData({
        ...formData,
        equipment: formData.equipment.filter((_, i) => i !== index),
      });
    }
  };
  
  const updateEquipment = (index: number, field: keyof EquipmentItem, value: string | number) => {
    const updated = [...formData.equipment];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, equipment: updated });
  };
  
  const handleDiscardChanges = () => {
    if (originalData) {
      setFormData({ ...originalData });
      toast.info('Changes discarded');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shipment) return;
    
    if (!formData.salesperson || !formData.portOfLoading || !formData.portOfDischarge) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Build change tracking
    const changedFields: { field: string; oldValue: string; newValue: string }[] = [];
    
    if (originalData) {
      if (formData.salesperson !== originalData.salesperson) {
        changedFields.push({ field: 'salesperson', oldValue: originalData.salesperson, newValue: formData.salesperson });
      }
      if (formData.clientName !== originalData.clientName) {
        changedFields.push({ field: 'clientName', oldValue: originalData.clientName, newValue: formData.clientName });
      }
      if (formData.portOfLoading !== originalData.portOfLoading) {
        changedFields.push({ field: 'portOfLoading', oldValue: originalData.portOfLoading, newValue: formData.portOfLoading });
      }
      if (formData.portOfDischarge !== originalData.portOfDischarge) {
        changedFields.push({ field: 'portOfDischarge', oldValue: originalData.portOfDischarge, newValue: formData.portOfDischarge });
      }
      if (formData.modeOfTransport !== originalData.modeOfTransport) {
        changedFields.push({ field: 'modeOfTransport', oldValue: originalData.modeOfTransport, newValue: formData.modeOfTransport });
      }
      if (formData.incoterm !== originalData.incoterm) {
        changedFields.push({ field: 'incoterm', oldValue: originalData.incoterm, newValue: formData.incoterm });
      }
      if (formData.paymentTerms !== originalData.paymentTerms) {
        changedFields.push({ field: 'paymentTerms', oldValue: originalData.paymentTerms, newValue: formData.paymentTerms });
      }
      if (JSON.stringify(formData.equipment) !== JSON.stringify(originalData.equipment)) {
        changedFields.push({ 
          field: 'equipment', 
          oldValue: originalData.equipment.map(e => `${e.type}×${e.quantity}`).join(', '),
          newValue: formData.equipment.map(e => `${e.type}×${e.quantity}`).join(', ')
        });
      }
      if (formData.pricingOwner !== originalData.pricingOwner) {
        changedFields.push({ field: 'pricingOwner', oldValue: originalData.pricingOwner || 'None', newValue: formData.pricingOwner || 'None' });
      }
    }
    
    try {
      await trackUpdateShipment(shipment, {
        salesperson: formData.salesperson,
        clientName: formData.clientName || undefined,
        portOfLoading: formData.portOfLoading,
        portOfDischarge: formData.portOfDischarge,
        equipment: formData.equipment,
        modeOfTransport: formData.modeOfTransport,
        paymentTerms: formData.paymentTerms,
        incoterm: formData.incoterm,
        pricingOwner: formData.pricingOwner ? formData.pricingOwner as 'Uma' | 'Rania' | 'Mozayan' : undefined,
      }, changedFields);
      
      toast.success('Lead updated successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Failed to update lead');
    }
  };
  
  if (!shipment) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Edit Lead: {shipment.referenceId}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Salesperson *</Label>
              <Select
                value={formData.salesperson}
                onValueChange={(v) => setFormData({ ...formData, salesperson: v })}
                disabled={!canEditSalesperson}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select salesperson" />
                </SelectTrigger>
                <SelectContent>
                  {SALESPEOPLE.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Client Name</Label>
              <ClientNameCombobox
                value={formData.clientName}
                onValueChange={(v) => setFormData({ ...formData, clientName: v })}
                placeholder="Select or enter client"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Mode of Transport</Label>
            <Select
              value={formData.modeOfTransport}
              onValueChange={(v) => setFormData({ ...formData, modeOfTransport: v as ModeOfTransport })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sea">Sea Freight</SelectItem>
                <SelectItem value="air">Air Freight</SelectItem>
                <SelectItem value="land">Land Transport</SelectItem>
                <SelectItem value="multimodal">Multimodal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{formData.modeOfTransport === 'air' ? 'Airport of Origin *' : 'Port of Loading *'}</Label>
              <SearchableSelect
                value={formData.portOfLoading}
                onValueChange={(v) => setFormData({ ...formData, portOfLoading: v })}
                options={locationOptions}
                placeholder={formData.modeOfTransport === 'air' ? 'Select airport' : 'Select port'}
                searchPlaceholder="Search or add new..."
                allowCustom
              />
            </div>
            <div className="space-y-2">
              <Label>{formData.modeOfTransport === 'air' ? 'Airport of Destination *' : 'Port of Discharge *'}</Label>
              <SearchableSelect
                value={formData.portOfDischarge}
                onValueChange={(v) => setFormData({ ...formData, portOfDischarge: v })}
                options={locationOptions}
                placeholder={formData.modeOfTransport === 'air' ? 'Select airport' : 'Select port'}
                searchPlaceholder="Search or add new..."
                allowCustom
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Equipment</Label>
              {formData.equipment.length < 3 && (
                <Button type="button" variant="ghost" size="sm" onClick={addEquipment} className="h-7 text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Add Equipment
                </Button>
              )}
            </div>
            {formData.equipment.map((eq, index) => (
              <div key={index} className="grid grid-cols-[1fr,100px,40px] gap-2 items-end">
                <Select
                  value={eq.type}
                  onValueChange={(v) => updateEquipment(index, 'type', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20ft">20ft Container</SelectItem>
                    <SelectItem value="40ft">40ft Container</SelectItem>
                    <SelectItem value="40hc">40ft High Cube</SelectItem>
                    <SelectItem value="45ft">45ft Container</SelectItem>
                    <SelectItem value="lcl">LCL</SelectItem>
                    <SelectItem value="breakbulk">Breakbulk</SelectItem>
                    <SelectItem value="airfreight">Airfreight</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={1}
                  value={eq.quantity}
                  onChange={(e) => updateEquipment(index, 'quantity', parseInt(e.target.value) || 1)}
                  placeholder="Qty"
                />
                {formData.equipment.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeEquipment(index)} className="h-9 w-9 p-0 text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Incoterm</Label>
              <Select
                value={formData.incoterm}
                onValueChange={(v) => setFormData({ ...formData, incoterm: v as Incoterm })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select incoterm" />
                </SelectTrigger>
                <SelectContent>
                  {INCOTERMS.map((term) => (
                    <SelectItem key={term.value} value={term.value}>{term.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment Terms</Label>
              <Select
                value={formData.paymentTerms}
                onValueChange={(v) => setFormData({ ...formData, paymentTerms: v as PaymentTerms })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 Days (Cash)</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="60">60 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Pricing Owner</Label>
            <Select
              value={formData.pricingOwner}
              onValueChange={(v) => setFormData({ ...formData, pricingOwner: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select pricing owner (optional)" />
              </SelectTrigger>
              <SelectContent>
                {PRICING_OWNERS.map((owner) => (
                  <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-between pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={handleDiscardChanges}
              disabled={!hasChanges}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Discard Changes
            </Button>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!hasChanges}>Save Changes</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
