import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Plus, Upload } from 'lucide-react';
import { useTelesalesContacts } from '@/hooks/useTelesalesContacts';
import { TelesalesContact } from '@/hooks/useTelesalesContacts';
import { ContactsTable } from '@/components/telesales/ContactsTable';
import { AddContactDialog } from '@/components/telesales/AddContactDialog';
import { ImportContactsDialog } from '@/components/telesales/ImportContactsDialog';
import { LogCallDialog } from '@/components/telesales/LogCallDialog';
import { ContactDetailPanel } from '@/components/telesales/ContactDetailPanel';
import { ConvertToLeadDialog } from '@/components/telesales/ConvertToLeadDialog';
import { TelesalesKPIs } from '@/components/telesales/TelesalesKPIs';

export default function Telesales() {
  const { contacts, isLoading } = useTelesalesContacts();
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [logCallContact, setLogCallContact] = useState<TelesalesContact | null>(null);
  const [detailContact, setDetailContact] = useState<TelesalesContact | null>(null);
  const [convertContact, setConvertContact] = useState<TelesalesContact | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Telesales" description="Track contacts, calls, and conversions" />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4 mr-1" /> Import CSV
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Contact
          </Button>
        </div>
      </div>

      <Tabs defaultValue="contacts">
        <TabsList>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="today">Today's Calls</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts">
          {isLoading ? (
            <p className="text-muted-foreground py-8 text-center">Loading...</p>
          ) : (
            <ContactsTable
              contacts={contacts}
              onLogCall={c => setLogCallContact(c)}
              onViewDetail={c => setDetailContact(c)}
              onConvert={c => setConvertContact(c)}
            />
          )}
        </TabsContent>

        <TabsContent value="today">
          {isLoading ? (
            <p className="text-muted-foreground py-8 text-center">Loading...</p>
          ) : (
            <ContactsTable
              contacts={contacts}
              onLogCall={c => setLogCallContact(c)}
              onViewDetail={c => setDetailContact(c)}
              onConvert={c => setConvertContact(c)}
              todayOnly
            />
          )}
        </TabsContent>

        <TabsContent value="performance">
          <TelesalesKPIs contacts={contacts} />
        </TabsContent>
      </Tabs>

      <AddContactDialog open={addOpen} onOpenChange={setAddOpen} />
      <ImportContactsDialog open={importOpen} onOpenChange={setImportOpen} />
      <LogCallDialog open={!!logCallContact} onOpenChange={o => !o && setLogCallContact(null)} contact={logCallContact} />
      <ContactDetailPanel
        open={!!detailContact}
        onOpenChange={o => !o && setDetailContact(null)}
        contact={detailContact}
        onLogCall={() => { setLogCallContact(detailContact); setDetailContact(null); }}
        onConvert={() => { setConvertContact(detailContact); setDetailContact(null); }}
      />
      <ConvertToLeadDialog open={!!convertContact} onOpenChange={o => !o && setConvertContact(null)} contact={convertContact} />
    </div>
  );
}
