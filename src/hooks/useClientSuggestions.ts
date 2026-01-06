import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useClientSuggestions() {
  return useQuery({
    queryKey: ['client-suggestions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select('client_name')
        .not('client_name', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get unique client names, preserving most recent first
      const seen = new Set<string>();
      const uniqueClients: string[] = [];
      
      for (const row of data || []) {
        const name = row.client_name?.trim();
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          uniqueClients.push(name);
        }
      }

      return uniqueClients;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
