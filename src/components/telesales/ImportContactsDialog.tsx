import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, AlertTriangle } from 'lucide-react';
import { useTelesalesContacts } from '@/hooks/useTelesalesContacts';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

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

// Extended auto-mapping rules for NSS and TradeAtlas files
const COLUMN_ALIASES: Record<string, string[]> = {
  contact_name: ['contactname', 'englishname', 'name', 'fullname', 'clientname'],
  company_name: ['companyname', 'company', 'exportername', 'exporter'],
  phone: ['phone', 'mobile', 'mobileno', 'phoneno', 'telephone', 'tel'],
  email: ['email', 'emailaddress', 'mail'],
  industry: ['industry', 'sector', 'productdetails', 'product', 'products', 'productdescription'],
  notes: ['notes', 'address', 'exporteraddress', 'remarks', 'comment', 'comments'],
  source: ['source', 'origin', 'database'],
};

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function detectSource(headers: string[]): string {
  const joined = headers.map(normalizeHeader).join(' ');
  if (joined.includes('exportername') || joined.includes('portofdeparture')) return 'TradeAtlas';
  if (joined.includes('englishname') || joined.includes('arabicname')) return 'NSS Clients';
  return '';
}

function buildAutoMapping(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  const normalized = headers.map(normalizeHeader);

  for (const field of FIELDS) {
    if (field === 'source') continue; // handled separately
    const aliases = COLUMN_ALIASES[field] || [];
    const idx = normalized.findIndex(n => aliases.some(a => n.includes(a)));
    if (idx >= 0 && !Object.values(map).includes(String(idx))) {
      map[field] = String(idx);
    }
  }
  return map;
}

// For NSS files, combine Arabic Name + Address into notes; for TradeAtlas, combine address + port
function buildNotesFromRow(row: string[], headers: string[], source: string): string {
  const norm = headers.map(normalizeHeader);
  const parts: string[] = [];

  if (source === 'NSS Clients') {
    const arabicIdx = norm.findIndex(n => n.includes('arabicname'));
    if (arabicIdx >= 0 && row[arabicIdx]?.trim()) parts.push(`Arabic: ${row[arabicIdx].trim()}`);
    const addrIdx = norm.findIndex(n => n.includes('address'));
    if (addrIdx >= 0 && row[addrIdx]?.trim()) parts.push(`Address: ${row[addrIdx].trim()}`);
  } else if (source === 'TradeAtlas') {
    const addrIdx = norm.findIndex(n => n.includes('exporteraddress'));
    if (addrIdx >= 0 && row[addrIdx]?.trim()) parts.push(`Address: ${row[addrIdx].trim()}`);
    const portIdx = norm.findIndex(n => n.includes('portofdeparture') || n.includes('port'));
    if (portIdx >= 0 && row[portIdx]?.trim()) parts.push(`Port: ${row[portIdx].trim()}`);
    const countryIdx = norm.findIndex(n => n.includes('exportercountry') || n.includes('country'));
    if (countryIdx >= 0 && row[countryIdx]?.trim()) parts.push(`Country: ${row[countryIdx].trim()}`);
  }

  return parts.join(' | ');
}

export function ImportContactsDialog({ open, onOpenChange }: Props) {
  const { addContacts, contacts } = useTelesalesContacts();
  const { profile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [sourceTag, setSourceTag] = useState('');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [duplicateCount, setDuplicateCount] = useState(0);

  const parseData = (hdrs: string[], dataRows: string[][]) => {
    setHeaders(hdrs);
    setRows(dataRows);
    const autoMap = buildAutoMapping(hdrs);
    setMapping(autoMap);
    const detected = detectSource(hdrs);
    setSourceTag(detected);
  };

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) { toast.error('CSV must have a header and at least one row'); return; }
    const hdrs = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const dataRows = lines.slice(1).map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
    parseData(hdrs, dataRows);
  };

  const parseExcel = (buffer: ArrayBuffer) => {
    try {
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (json.length < 2) { toast.error('Excel file must have a header and at least one row'); return; }
      const hdrs = json[0].map(h => String(h).trim());
      const dataRows = json.slice(1)
        .filter(r => r.some(c => String(c).trim()))
        .map(r => r.map(c => String(c).trim()));
      parseData(hdrs, dataRows);
    } catch {
      toast.error('Failed to parse Excel file');
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv' || ext === 'txt') {
      const reader = new FileReader();
      reader.onload = (ev) => parseCSV(ev.target?.result as string);
      reader.readAsText(file);
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (ev) => parseExcel(ev.target?.result as ArrayBuffer);
      reader.readAsArrayBuffer(file);
    } else {
      toast.error('Unsupported file type. Use CSV, XLS, or XLSX.');
    }
  };

  // Duplicate detection
  useEffect(() => {
    if (rows.length === 0 || headers.length === 0) { setDuplicateCount(0); return; }

    const existingPhones = new Set(contacts.map(c => c.phone?.replace(/\D/g, '')).filter(Boolean));
    const existingCompanies = new Set(contacts.map(c => c.company_name?.toLowerCase().trim()).filter(Boolean));

    let dupes = 0;
    rows.forEach(row => {
      const phoneIdx = mapping['phone'];
      const companyIdx = mapping['company_name'];
      const phone = phoneIdx !== undefined ? row[parseInt(phoneIdx)]?.replace(/\D/g, '') : '';
      const company = companyIdx !== undefined ? row[parseInt(companyIdx)]?.toLowerCase().trim() : '';
      if ((phone && existingPhones.has(phone)) || (company && existingCompanies.has(company))) dupes++;
    });
    setDuplicateCount(dupes);
  }, [rows, mapping, contacts, headers]);

  const handleImport = () => {
    const existingPhones = new Set(contacts.map(c => c.phone?.replace(/\D/g, '')).filter(Boolean));
    const existingCompanies = new Set(contacts.map(c => c.company_name?.toLowerCase().trim()).filter(Boolean));

    const parsedContacts = rows.map(row => {
      const obj: Record<string, string | null> = {};
      FIELDS.forEach(field => {
        if (field === 'source') {
          obj[field] = sourceTag || null;
          return;
        }
        if (field === 'notes') {
          // Start with mapped notes column value
          const colIdx = mapping[field];
          const mappedNotes = colIdx !== undefined ? row[parseInt(colIdx)] || '' : '';
          const extraNotes = buildNotesFromRow(row, headers, sourceTag);
          const combined = [mappedNotes, extraNotes].filter(Boolean).join(' | ');
          obj[field] = combined || null;
          return;
        }
        const colIdx = mapping[field];
        obj[field] = colIdx !== undefined ? row[parseInt(colIdx)] || null : null;
      });
      return { ...obj, assigned_to: profile?.name || null, status: 'new' as const };
    });

    // Filter valid
    let valid = parsedContacts.filter(c => c['phone'] && (c['contact_name'] || c['company_name']));

    // Skip duplicates if enabled
    if (skipDuplicates && duplicateCount > 0) {
      valid = valid.filter(c => {
        const phone = c['phone']?.replace(/\D/g, '') || '';
        const company = c['company_name']?.toLowerCase().trim() || '';
        return !(phone && existingPhones.has(phone)) && !(company && existingCompanies.has(company));
      });
    }

    if (valid.length === 0) { toast.error('No valid rows to import (need phone + name)'); return; }

    addContacts.mutate(valid);
    onOpenChange(false);
    resetState();
  };

  const resetState = () => {
    setHeaders([]);
    setRows([]);
    setMapping({});
    setSourceTag('');
    setDuplicateCount(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Contacts</DialogTitle>
        </DialogHeader>

        {headers.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Upload className="w-12 h-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Supports CSV, XLS, and XLSX files</p>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              Select File
            </Button>
            <input ref={fileRef} type="file" accept=".csv,.txt,.xlsx,.xls" className="hidden" onChange={handleFile} />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Source tag */}
            <div>
              <Label className="text-xs">Source Tag</Label>
              <Input
                value={sourceTag}
                onChange={e => setSourceTag(e.target.value)}
                placeholder="e.g. NSS Clients, TradeAtlas"
                className="h-8 text-xs"
              />
            </div>

            {/* Column mapping */}
            <div className="grid grid-cols-2 gap-3">
              {FIELDS.filter(f => f !== 'source').map(field => (
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

            {/* Duplicate detection */}
            {duplicateCount > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-700">
                <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0" />
                <div className="flex-1 text-xs">
                  <span className="font-medium">{duplicateCount} duplicate(s)</span> found (matching phone or company name)
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="skip-dupes"
                    checked={skipDuplicates}
                    onCheckedChange={v => setSkipDuplicates(!!v)}
                  />
                  <Label htmlFor="skip-dupes" className="text-xs cursor-pointer">Skip duplicates</Label>
                </div>
              </div>
            )}

            {/* Preview */}
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
            <p className="text-xs text-muted-foreground">
              {rows.length} rows total
              {skipDuplicates && duplicateCount > 0 && ` · ${rows.length - duplicateCount} will be imported`}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); resetState(); }}>Cancel</Button>
          {headers.length > 0 && (
            <Button onClick={handleImport} disabled={addContacts.isPending}>
              Import {skipDuplicates ? Math.max(rows.length - duplicateCount, 0) : rows.length} Contacts
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
