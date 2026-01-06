import { useState, useEffect } from 'react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { EquipmentType, ModeOfTransport, PaymentTerms, Incoterm, EquipmentItem } from '@/types/shipment';
import { INCOTERMS, getLocationOptions } from '@/lib/ports';
import { SALESPERSON_REF_PREFIX, UserRole } from '@/types/permissions';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

const SALESPEOPLE = Object.keys(SALESPERSON_REF_PREFIX) as readonly string[];

export function LeadForm() {
  const [open, setOpen] = useState(false);
  const { createShipment, trackMoveToStage, shipments } = useTrackedShipmentActions();
  const { profile, roles } = useAuth();
  
  // Use roles from auth for multi-role support
  const userRoles = (roles || []) as UserRole[];
  
  // Users with admin, pricing, or ops roles can create leads for any salesperson
  const canCreateForOthers = userRoles.some(role => 
    ['admin', 'pricing', 'ops'].includes(role)
  );
  const isSalesOnly = userRoles.includes('sales') && !canCreateForOthers;
  
  const [formData, setFormData] = useState({
    salesperson: '',
    portOfLoading: '',
    portOfDischarge: '',
    equipment: [{ type: '' as EquipmentType, quantity: 1 }] as EquipmentItem[],
    modeOfTransport: 'sea' as ModeOfTransport,
    paymentTerms: '' as PaymentTerms,
    incoterm: '' as Incoterm,
    clientName: '',
  });
  
  // Get location options based on mode
  const locationOptions = getLocationOptions(formData.modeOfTransport);
  
  // Auto-set salesperson for sales-only role when dialog opens
  // Use ref_prefix to find the matching salesperson name from SALESPERSON_REF_PREFIX
  useEffect(() => {
    if (open && isSalesOnly && profile?.ref_prefix) {
      const salespersonName = Object.entries(SALESPERSON_REF_PREFIX).find(
        ([_, prefix]) => prefix === profile.ref_prefix
      )?.[0];
      
      if (salespersonName) {
        setFormData(prev => ({ ...prev, salesperson: salespersonName }));
      }
    }
  }, [open, isSalesOnly, profile?.ref_prefix]);
  
  // Reset ports when mode changes
  useEffect(() => {
    // Only reset if current ports don't match the new mode options
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.salesperson || !formData.portOfLoading || !formData.portOfDischarge) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    const newShipment = await createShipment(formData);
    
    // Show toast with action to move to pricing
    toast.success('Lead created successfully', {
      action: {
        label: 'Move to Pricing',
        onClick: async () => {
          if (newShipment) {
            try {
              await trackMoveToStage(newShipment, 'pricing');
              toast.success(`${newShipment.referenceId} moved to Pricing`);
            } catch (error) {
              console.error('Failed to move to pricing:', error);
              toast.error('Failed to move to Pricing');
            }
          }
        },
      },
      duration: 8000,
    });
    
    setOpen(false);
    setFormData({
      salesperson: '',
      portOfLoading: '',
      portOfDischarge: '',
      equipment: [{ type: '' as EquipmentType, quantity: 1 }],
      modeOfTransport: 'sea' as ModeOfTransport,
      paymentTerms: '' as PaymentTerms,
      incoterm: '' as Incoterm,
      clientName: '',
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Create New Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Salesperson *</Label>
              <Select
                value={formData.salesperson}
                onValueChange={(v) => setFormData({ ...formData, salesperson: v })}
                disabled={isSalesOnly}
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
              {isSalesOnly && (
                <p className="text-xs text-muted-foreground">You can only create leads for yourself</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Client Name</Label>
              <Input
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="Enter client name"
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
                searchPlaceholder="Search..."
              />
            </div>
            <div className="space-y-2">
              <Label>{formData.modeOfTransport === 'air' ? 'Airport of Destination *' : 'Port of Discharge *'}</Label>
              <SearchableSelect
                value={formData.portOfDischarge}
                onValueChange={(v) => setFormData({ ...formData, portOfDischarge: v })}
                options={locationOptions}
                placeholder={formData.modeOfTransport === 'air' ? 'Select airport' : 'Select port'}
                searchPlaceholder="Search..."
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
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Lead</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
