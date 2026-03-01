import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';
import { useTelesalesContacts } from '@/hooks/useTelesalesContacts';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FIELDS = ['contact_name', 'company_name', 'phone', 'email', 'industry', 'source', 'notes'] as const;
const FIELD_LABELS: Record<string, string> = {
  contact_name: 'Contact Name',
  company_name: 'Company Name',
  phone: 'Phone',
  email: 'Email',
  industry: 'Industry',
  source: 'Source',
  notes: 'Notes',
};

export function ImportContactsDialog({ open, onOpenChange }: Props) {
  const { addContacts } = useTelesalesContacts();
  const { profile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) { toast.error('CSV must have a header and at least one row'); return; }
    const hdrs = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const dataRows = lines.slice(1).map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
    setHeaders(hdrs);
    setRows(dataRows);

    // Auto-map by fuzzy match
    const autoMap: Record<string, string> = {};
    FIELDS.forEach(field => {
      const idx = hdrs.findIndex(h =>
        h.toLowerCase().replace(/[_ ]/g, '').includes(field.replace(/_/g, ''))
      );
      if (idx >= 0) autoMap[field] = String(idx);
    });
    setMapping(autoMap);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => parseCSV(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleImport = () => {
    const parsedContacts = rows.map(row => {
      const obj: Record<string, string | null> = {};
      FIELDS.forEach(field => {
        const colIdx = mapping[field];
        obj[field] = colIdx !== undefined ? row[parseInt(colIdx)] || null : null;
      });
      return { ...obj, assigned_to: profile?.name || null, status: 'new' as const };
    });

    // Validate: need at least phone and (contact_name or company_name)
    const valid = parsedContacts.filter(c => c['phone'] && (c['contact_name'] || c['company_name']));
    if (valid.length === 0) { toast.error('No valid rows found (need phone + name)'); return; }

    addContacts.mutate(valid);
    onOpenChange(false);
    setHeaders([]);
    setRows([]);
    setMapping({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Contacts from CSV</DialogTitle>
        </DialogHeader>

        {headers.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Upload className="w-12 h-12 text-muted-foreground" />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              Select CSV File
            </Button>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {FIELDS.map(field => (
                <div key={field}>
                  <Label className="text-xs">{FIELD_LABELS[field]}</Label>
                  <Select value={mapping[field] || ''} onValueChange={v => setMapping(m => ({ ...m, [field]: v }))}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="— skip —" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((h, i) => (
                        <SelectItem key={i} value={String(i)}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="text-sm font-medium text-muted-foreground">Preview (first 10 rows)</div>
            <div className="border rounded-md overflow-auto max-h-60">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((h, i) => <TableHead key={i} className="text-xs">{h}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 10).map((row, i) => (
                    <TableRow key={i}>
                      {row.map((cell, j) => <TableCell key={j} className="text-xs py-1">{cell}</TableCell>)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground">{rows.length} rows total</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); setHeaders([]); setRows([]); }}>Cancel</Button>
          {headers.length > 0 && (
            <Button onClick={handleImport} disabled={addContacts.isPending}>
              Import {rows.length} Contacts
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
