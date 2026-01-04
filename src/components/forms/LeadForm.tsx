import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/userStore';
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
import { WORLD_PORTS, INCOTERMS } from '@/lib/ports';
import { SALESPERSON_REF_PREFIX } from '@/types/permissions';

const SALESPEOPLE = Object.keys(SALESPERSON_REF_PREFIX) as readonly string[];

export function LeadForm() {
  const [open, setOpen] = useState(false);
  const { createShipment } = useTrackedShipmentActions();
  const currentUser = useUserStore((s) => s.currentUser);
  
  // Sales users can only create leads for themselves
  const isSales = currentUser.role === 'sales';
  
  const [formData, setFormData] = useState({
    salesperson: '',
    portOfLoading: '',
    portOfDischarge: '',
    equipment: [{ type: '' as EquipmentType, quantity: 1 }] as EquipmentItem[],
    modeOfTransport: '' as ModeOfTransport,
    paymentTerms: '' as PaymentTerms,
    incoterm: '' as Incoterm,
  });
  
  // Auto-set salesperson for sales role when dialog opens
  useEffect(() => {
    if (open && isSales && currentUser.name) {
      setFormData(prev => ({ ...prev, salesperson: currentUser.name }));
    }
  }, [open, isSales, currentUser.name]);
  
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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.salesperson || !formData.portOfLoading || !formData.portOfDischarge) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    createShipment(formData);
    toast.success('Lead created successfully');
    setOpen(false);
    setFormData({
      salesperson: '',
      portOfLoading: '',
      portOfDischarge: '',
      equipment: [{ type: '' as EquipmentType, quantity: 1 }],
      modeOfTransport: '' as ModeOfTransport,
      paymentTerms: '' as PaymentTerms,
      incoterm: '' as Incoterm,
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
          <div className="space-y-2">
            <Label>Salesperson *</Label>
            <Select
              value={formData.salesperson}
              onValueChange={(v) => setFormData({ ...formData, salesperson: v })}
              disabled={isSales}
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
            {isSales && (
              <p className="text-xs text-muted-foreground">You can only create leads for yourself</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Port of Loading *</Label>
              <Select
                value={formData.portOfLoading}
                onValueChange={(v) => setFormData({ ...formData, portOfLoading: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select port" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {WORLD_PORTS.map((port) => (
                    <SelectItem key={port} value={port}>{port}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Port of Discharge *</Label>
              <Select
                value={formData.portOfDischarge}
                onValueChange={(v) => setFormData({ ...formData, portOfDischarge: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select port" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {WORLD_PORTS.map((port) => (
                    <SelectItem key={port} value={port}>{port}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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