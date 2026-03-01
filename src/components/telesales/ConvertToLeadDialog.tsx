import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TelesalesContact, useTelesalesContacts } from '@/hooks/useTelesalesContacts';
import { useShipments } from '@/hooks/useShipments';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: TelesalesContact | null;
}

export function ConvertToLeadDialog({ open, onOpenChange, contact }: Props) {
  const { addShipment, isAdding } = useShipments();
  const { updateContact } = useTelesalesContacts();
  const { profile } = useAuth();
  const [portOfLoading, setPortOfLoading] = useState('');
  const [portOfDischarge, setPortOfDischarge] = useState('');
  const [modeOfTransport, setModeOfTransport] = useState<'sea' | 'land' | 'air'>('sea');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!contact || !portOfLoading || !portOfDischarge) return;
    setSubmitting(true);
    try {
      const shipment = await addShipment({
        salesperson: profile?.name || '',
        clientName: contact.company_name || contact.contact_name || '',
        portOfLoading,
        portOfDischarge,
        equipment: [],
        modeOfTransport,
        paymentTerms: '30',
        incoterm: 'FOB',
        currency: 'USD',
        invoiceCurrency: 'USD',
      } as any);

      await updateContact.mutateAsync({
        id: contact.id,
        updates: { status: 'converted', converted_shipment_id: shipment.id },
      });

      toast.success('Contact converted to Lead');
      onOpenChange(false);
    } catch {
      toast.error('Failed to convert');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Convert to Lead</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Client Name</Label>
            <Input value={contact?.company_name || contact?.contact_name || ''} disabled />
          </div>
          <div>
            <Label>Salesperson</Label>
            <Input value={profile?.name || ''} disabled />
          </div>
          <div>
            <Label>Port of Loading *</Label>
            <Input value={portOfLoading} onChange={e => setPortOfLoading(e.target.value)} placeholder="e.g. Aqaba" />
          </div>
          <div>
            <Label>Port of Discharge *</Label>
            <Input value={portOfDischarge} onChange={e => setPortOfDischarge(e.target.value)} placeholder="e.g. Jeddah" />
          </div>
          <div>
            <Label>Mode of Transport</Label>
            <Select value={modeOfTransport} onValueChange={v => setModeOfTransport(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sea">Sea</SelectItem>
                <SelectItem value="land">Land</SelectItem>
                <SelectItem value="air">Air</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!portOfLoading || !portOfDischarge || submitting}>
            Create Lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
