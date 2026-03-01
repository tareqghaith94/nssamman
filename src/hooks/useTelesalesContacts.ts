import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface TelesalesContact {
  id: string;
  created_at: string;
  created_by: string | null;
  company_name: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  industry: string | null;
  source: string | null;
  status: string;
  next_follow_up: string | null;
  assigned_to: string | null;
  notes: string | null;
  converted_shipment_id: string | null;
  updated_at: string;
  call_count?: number;
}

export type ContactStatus = 'new' | 'in_progress' | 'converted' | 'not_interested' | 'do_not_call';

export function useTelesalesContacts() {
  const queryClient = useQueryClient();
  const { user, session } = useAuth();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['telesales_contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telesales_contacts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch call counts
      const { data: callCounts, error: ccErr } = await supabase
        .from('telesales_calls')
        .select('contact_id');
      if (ccErr) throw ccErr;

      const countMap: Record<string, number> = {};
      callCounts?.forEach((c: { contact_id: string }) => {
        countMap[c.contact_id] = (countMap[c.contact_id] || 0) + 1;
      });

      return (data as TelesalesContact[]).map(c => ({
        ...c,
        call_count: countMap[c.id] || 0,
      }));
    },
    enabled: !!session,
  });

  const addContact = useMutation({
    mutationFn: async (contact: Partial<TelesalesContact>) => {
      const { data, error } = await supabase
        .from('telesales_contacts')
        .insert({ ...contact, created_by: user?.id } as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telesales_contacts'] });
      toast.success('Contact added');
    },
    onError: (e) => { console.error(e); toast.error('Failed to add contact'); },
  });

  const addContacts = useMutation({
    mutationFn: async (rows: Partial<TelesalesContact>[]) => {
      const payload = rows.map(r => ({ ...r, created_by: user?.id }));
      const { error } = await supabase
        .from('telesales_contacts')
        .insert(payload as never[]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telesales_contacts'] });
      toast.success('Contacts imported');
    },
    onError: (e) => { console.error(e); toast.error('Failed to import contacts'); },
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TelesalesContact> }) => {
      const { error } = await supabase
        .from('telesales_contacts')
        .update(updates as never)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telesales_contacts'] });
    },
    onError: (e) => { console.error(e); toast.error('Failed to update contact'); },
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('telesales_contacts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telesales_contacts'] });
      toast.success('Contact deleted');
    },
    onError: (e) => { console.error(e); toast.error('Failed to delete contact'); },
  });

  return { contacts, isLoading, addContact, addContacts, updateContact, deleteContact };
}
