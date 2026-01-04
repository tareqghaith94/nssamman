import { useState } from 'react';
import { useShipmentStore } from '@/store/shipmentStore';
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
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { EquipmentType, ModeOfTransport, PaymentTerms } from '@/types/shipment';

export function LeadForm() {
  const [open, setOpen] = useState(false);
  const addShipment = useShipmentStore((s) => s.addShipment);
  
  const [formData, setFormData] = useState({
    salesperson: '',
    portOfLoading: '',
    portOfDischarge: '',
    equipmentType: '' as EquipmentType,
    quantity: 1,
    modeOfTransport: '' as ModeOfTransport,
    paymentTerms: '' as PaymentTerms,
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.salesperson || !formData.portOfLoading || !formData.portOfDischarge) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    addShipment(formData);
    toast.success('Lead created successfully');
    setOpen(false);
    setFormData({
      salesperson: '',
      portOfLoading: '',
      portOfDischarge: '',
      equipmentType: '' as EquipmentType,
      quantity: 1,
      modeOfTransport: '' as ModeOfTransport,
      paymentTerms: '' as PaymentTerms,
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">Create New Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="salesperson">Salesperson Name *</Label>
            <Input
              id="salesperson"
              value={formData.salesperson}
              onChange={(e) => setFormData({ ...formData, salesperson: e.target.value })}
              placeholder="Enter salesperson name"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pol">Port of Loading *</Label>
              <Input
                id="pol"
                value={formData.portOfLoading}
                onChange={(e) => setFormData({ ...formData, portOfLoading: e.target.value })}
                placeholder="e.g., Aqaba"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pod">Port of Discharge *</Label>
              <Input
                id="pod"
                value={formData.portOfDischarge}
                onChange={(e) => setFormData({ ...formData, portOfDischarge: e.target.value })}
                placeholder="e.g., Jebel Ali"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Equipment Type</Label>
              <Select
                value={formData.equipmentType}
                onValueChange={(v) => setFormData({ ...formData, equipmentType: v as EquipmentType })}
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
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>
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
              <Label>Payment Terms</Label>
              <Select
                value={formData.paymentTerms}
                onValueChange={(v) => setFormData({ ...formData, paymentTerms: v as PaymentTerms })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prepaid">Prepaid</SelectItem>
                  <SelectItem value="collect">Collect</SelectItem>
                  <SelectItem value="30days">30 Days</SelectItem>
                  <SelectItem value="60days">60 Days</SelectItem>
                  <SelectItem value="90days">90 Days</SelectItem>
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
