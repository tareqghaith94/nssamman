import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhoneCall, Eye, ArrowRightLeft, Trash2 } from 'lucide-react';
import { TelesalesContact, useTelesalesContacts } from '@/hooks/useTelesalesContacts';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  contacts: TelesalesContact[];
  onLogCall: (c: TelesalesContact) => void;
  onViewDetail: (c: TelesalesContact) => void;
  onConvert: (c: TelesalesContact) => void;
  todayOnly?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  converted: 'bg-green-100 text-green-800',
  not_interested: 'bg-muted text-muted-foreground',
  do_not_call: 'bg-destructive/10 text-destructive',
};

export function ContactsTable({ contacts, onLogCall, onViewDetail, onConvert, todayOnly }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { deleteContact } = useTelesalesContacts();
  const { isAdmin } = useAuth();

  const today = new Date().toISOString().split('T')[0];

  let filtered = contacts;

  if (todayOnly) {
    filtered = filtered.filter(c =>
      (c.next_follow_up && c.next_follow_up <= today) || c.status === 'new'
    );
  }

  if (statusFilter !== 'all') {
    filtered = filtered.filter(c => c.status === statusFilter);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(c =>
      (c.contact_name || '').toLowerCase().includes(q) ||
      (c.company_name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
        {!todayOnly && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="not_interested">Not Interested</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="do_not_call">Do Not Call</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Follow-up</TableHead>
              <TableHead>Calls</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No contacts found.</TableCell></TableRow>
            )}
            {filtered.map(c => (
              <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onViewDetail(c)}>
                <TableCell className="font-medium">{c.contact_name || '—'}</TableCell>
                <TableCell>{c.company_name || '—'}</TableCell>
                <TableCell>{c.phone || '—'}</TableCell>
                <TableCell>
                  <Badge className={STATUS_COLORS[c.status] || ''} variant="secondary">
                    {c.status.replace(/_/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell>{c.next_follow_up || '—'}</TableCell>
                <TableCell>{c.call_count || 0}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{c.source || '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onLogCall(c)} title="Log Call">
                      <PhoneCall className="w-3.5 h-3.5" />
                    </Button>
                    {c.status !== 'converted' && c.status !== 'do_not_call' && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onConvert(c)} title="Convert to Lead">
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {isAdmin && (
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteContact.mutate(c.id)} title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
