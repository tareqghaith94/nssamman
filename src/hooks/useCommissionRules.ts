import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CommissionRule, CommissionConfig, FormulaType } from '@/types/commission';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export function useCommissionRules() {
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading, error } = useQuery({
    queryKey: ['commission-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('salesperson_commission_rules')
        .select('*')
        .order('salesperson');
      
      if (error) throw error;
      
      return (data || []).map(row => ({
        id: row.id,
        salesperson: row.salesperson,
        formula_type: row.formula_type as FormulaType,
        config: row.config as unknown as CommissionConfig,
        created_at: row.created_at,
        updated_at: row.updated_at,
        updated_by: row.updated_by,
      })) as CommissionRule[];
    },
  });

  const upsertRuleMutation = useMutation({
    mutationFn: async ({ 
      salesperson, 
      formula_type, 
      config 
    }: { 
      salesperson: string; 
      formula_type: FormulaType; 
      config: CommissionConfig;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Check if rule exists
      const { data: existing } = await supabase
        .from('salesperson_commission_rules')
        .select('id')
        .eq('salesperson', salesperson)
        .single();
      
      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('salesperson_commission_rules')
          .update({
            formula_type,
            config: config as unknown as Json,
            updated_by: user?.id,
          })
          .eq('salesperson', salesperson);
        
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('salesperson_commission_rules')
          .insert([{
            salesperson,
            formula_type,
            config: config as unknown as Json,
            updated_by: user?.id,
          }]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
      toast.success('Commission rule saved');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save rule: ${error.message}`);
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (salesperson: string) => {
      const { error } = await supabase
        .from('salesperson_commission_rules')
        .delete()
        .eq('salesperson', salesperson);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
      toast.success('Commission rule deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete rule: ${error.message}`);
    },
  });

  const getRuleForSalesperson = (salesperson: string): CommissionRule | undefined => {
    return rules.find(r => r.salesperson === salesperson);
  };

  return {
    rules,
    isLoading,
    error,
    upsertRule: upsertRuleMutation.mutate,
    deleteRule: deleteRuleMutation.mutate,
    isUpdating: upsertRuleMutation.isPending || deleteRuleMutation.isPending,
    getRuleForSalesperson,
  };
}
