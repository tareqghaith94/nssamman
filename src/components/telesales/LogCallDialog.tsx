import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTelesalesCalls, CALL_OUTCOMES, CallOutcome } from '@/hooks/useTelesalesCalls';
import { TelesalesContact } from '@/hooks/useTelesalesContacts';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: TelesalesContact | null;
}

export function LogCallDialog({ open, onOpenChange, contact }: Props) {
  const { logCall } = useTelesalesCalls();
  const [outcome, setOutcome] = useState<CallOutcome | ''>('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  const showFollowUp = outcome === 'callback' || outcome === 'interested';

  useEffect(() => {
    if (open) {
      setOutcome('');
      setNotes('');
      setFollowUpDate('');
    }
  }, [open]);

  const handleSubmit = () => {
    if (!contact || !outcome) return;
    logCall.mutate({
      contact_id: contact.id,
      called_by: null,
      call_date: new Date().toISOString(),
      outcome,
      duration_minutes: null,
      notes: notes || null,
      follow_up_date: followUpDate || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log Call — {contact?.contact_name || contact?.company_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Outcome *</Label>
            <Select value={outcome} onValueChange={(v) => setOutcome(v as CallOutcome)}>
              <SelectTrigger><SelectValue placeholder="Select outcome" /></SelectTrigger>
              <SelectContent>
                {CALL_OUTCOMES.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="What was discussed..." />
          </div>
          {showFollowUp && (
            <div>
              <Label>Follow-up Date</Label>
              <Input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!outcome || logCall.isPending}>Log Call</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
