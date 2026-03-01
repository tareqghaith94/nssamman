import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface TelesalesCall {
  id: string;
  contact_id: string;
  called_by: string | null;
  call_date: string;
  outcome: string;
  duration_minutes: number | null;
  notes: string | null;
  follow_up_date: string | null;
  created_at: string;
}

export type CallOutcome = 'interested' | 'not_interested' | 'callback' | 'no_answer' | 'wrong_number' | 'voicemail';

export const CALL_OUTCOMES: { value: CallOutcome; label: string }[] = [
  { value: 'interested', label: 'Interested' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'callback', label: 'Callback' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'wrong_number', label: 'Wrong Number' },
  { value: 'voicemail', label: 'Voicemail' },
];

export function useTelesalesCalls(contactId?: string) {
  const queryClient = useQueryClient();
  const { user, session } = useAuth();

  const { data: calls = [], isLoading } = useQuery({
    queryKey: ['telesales_calls', contactId],
    queryFn: async () => {
      let query = supabase
        .from('telesales_calls')
        .select('*')
        .order('call_date', { ascending: false });
      if (contactId) query = query.eq('contact_id', contactId);
      const { data, error } = await query;
      if (error) throw error;
      return data as TelesalesCall[];
    },
    enabled: !!session,
  });

  const logCall = useMutation({
    mutationFn: async (call: Omit<TelesalesCall, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('telesales_calls')
        .insert({ ...call, called_by: user?.id } as never)
        .select()
        .single();
      if (error) throw error;

      // Update contact status and follow-up
      const statusMap: Record<string, string> = {
        interested: 'in_progress',
        not_interested: 'not_interested',
        callback: 'in_progress',
        no_answer: 'in_progress',
        wrong_number: 'do_not_call',
        voicemail: 'in_progress',
      };
      const updates: Record<string, unknown> = {
        status: statusMap[call.outcome] || 'in_progress',
      };
      if (call.follow_up_date) {
        updates.next_follow_up = call.follow_up_date;
      }
      await supabase
        .from('telesales_contacts')
        .update(updates as never)
        .eq('id', call.contact_id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telesales_calls'] });
      queryClient.invalidateQueries({ queryKey: ['telesales_contacts'] });
      toast.success('Call logged');
    },
    onError: (e) => { console.error(e); toast.error('Failed to log call'); },
  });

  return { calls, isLoading, logCall };
}
