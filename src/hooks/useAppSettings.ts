import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Json } from '@/integrations/supabase/types';

interface CommissionRateSetting {
  percentage: number;
  description: string;
}

interface AppSetting {
  id: string;
  key: string;
  value: CommissionRateSetting;
  updated_at: string;
  updated_by: string | null;
}

interface RawAppSetting {
  id: string;
  key: string;
  value: Json;
  updated_at: string;
  updated_by: string | null;
}

function parseSettingValue(value: Json): CommissionRateSetting {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const obj = value as Record<string, Json>;
    return {
      percentage: typeof obj.percentage === 'number' ? obj.percentage : 4,
      description: typeof obj.description === 'string' ? obj.description : '',
    };
  }
  return { percentage: 4, description: '' };
}

export function useAppSettings() {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*');

      if (error) throw error;
      
      return (data as RawAppSetting[]).map((item): AppSetting => ({
        id: item.id,
        key: item.key,
        value: parseSettingValue(item.value),
        updated_at: item.updated_at,
        updated_by: item.updated_by,
      }));
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: CommissionRateSetting }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('app_settings')
        .update({ 
          value: value as unknown as Json,
          updated_at: new Date().toISOString(),
          updated_by: user?.id 
        })
        .eq('key', key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
    },
  });

  const getCommissionRate = (): number => {
    const setting = settings?.find(s => s.key === 'commission_rate');
    if (setting) {
      return setting.value.percentage / 100;
    }
    return 0.04; // Default 4%
  };

  const getCommissionPercentage = (): number => {
    const setting = settings?.find(s => s.key === 'commission_rate');
    if (setting) {
      return setting.value.percentage;
    }
    return 4; // Default 4%
  };

  const updateCommissionRate = async (percentage: number) => {
    await updateSettingMutation.mutateAsync({
      key: 'commission_rate',
      value: { percentage, description: 'Commission percentage of Gross Profit' },
    });
  };

  return {
    settings,
    isLoading,
    error,
    getCommissionRate,
    getCommissionPercentage,
    updateCommissionRate,
    isUpdating: updateSettingMutation.isPending,
    canEdit: isAdmin,
  };
}
