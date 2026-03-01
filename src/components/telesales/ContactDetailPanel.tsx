import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Building2, Calendar, PhoneCall, ArrowRightLeft } from 'lucide-react';
import { TelesalesContact } from '@/hooks/useTelesalesContacts';
import { useTelesalesCalls, CALL_OUTCOMES } from '@/hooks/useTelesalesCalls';
import { format } from 'date-fns';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: TelesalesContact | null;
  onLogCall: () => void;
  onConvert: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  converted: 'bg-green-100 text-green-800',
  not_interested: 'bg-muted text-muted-foreground',
  do_not_call: 'bg-destructive/10 text-destructive',
};

export function ContactDetailPanel({ open, onOpenChange, contact, onLogCall, onConvert }: Props) {
  const { calls } = useTelesalesCalls(contact?.id);

  if (!contact) return null;

  const outcomeLabel = (outcome: string) =>
    CALL_OUTCOMES.find(o => o.value === outcome)?.label || outcome;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{contact.contact_name || contact.company_name}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <Badge className={STATUS_COLORS[contact.status] || ''}>{contact.status.replace(/_/g, ' ')}</Badge>

          <div className="space-y-2 text-sm">
            {contact.company_name && (
              <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground" />{contact.company_name}</div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" />{contact.phone}</div>
            )}
            {contact.email && (
              <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" />{contact.email}</div>
            )}
            {contact.next_follow_up && (
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" />Follow-up: {contact.next_follow_up}</div>
            )}
            {contact.industry && <p className="text-muted-foreground">Industry: {contact.industry}</p>}
            {contact.source && <p className="text-muted-foreground">Source: {contact.source}</p>}
            {contact.notes && <p className="text-muted-foreground">{contact.notes}</p>}
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={onLogCall}><PhoneCall className="w-4 h-4 mr-1" />Log Call</Button>
            {contact.status !== 'converted' && contact.status !== 'do_not_call' && (
              <Button size="sm" variant="outline" onClick={onConvert}><ArrowRightLeft className="w-4 h-4 mr-1" />Convert to Lead</Button>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Call History ({calls.length})</h4>
            <div className="space-y-2">
              {calls.map(call => (
                <div key={call.id} className="border rounded-md p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <Badge variant="outline">{outcomeLabel(call.outcome)}</Badge>
                    <span className="text-xs text-muted-foreground">{format(new Date(call.call_date), 'dd MMM yyyy HH:mm')}</span>
                  </div>
                  {call.notes && <p className="text-muted-foreground">{call.notes}</p>}
                  {call.follow_up_date && <p className="text-xs">Follow-up: {call.follow_up_date}</p>}
                </div>
              ))}
              {calls.length === 0 && <p className="text-sm text-muted-foreground">No calls logged yet.</p>}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
