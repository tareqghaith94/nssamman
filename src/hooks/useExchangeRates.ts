import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Json } from '@/integrations/supabase/types';
import { Currency, CURRENCIES } from '@/lib/currency';

export interface ExchangeRates {
  // Rates are relative to USD (e.g., EUR: 0.92 means 1 USD = 0.92 EUR)
  USD: number;
  EUR: number;
  JOD: number;
}

const DEFAULT_RATES: ExchangeRates = {
  USD: 1,
  EUR: 0.92,
  JOD: 0.71,
};

function parseExchangeRates(value: Json): ExchangeRates {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const obj = value as Record<string, Json>;
    return {
      USD: 1, // USD is always base
      EUR: typeof obj.EUR === 'number' ? obj.EUR : DEFAULT_RATES.EUR,
      JOD: typeof obj.JOD === 'number' ? obj.JOD : DEFAULT_RATES.JOD,
    };
  }
  return DEFAULT_RATES;
}

export function useExchangeRates() {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const { data: rates, isLoading, error } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'exchange_rates')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No row found, return defaults
          return DEFAULT_RATES;
        }
        throw error;
      }
      
      return parseExchangeRates(data.value);
    },
  });

  const updateRatesMutation = useMutation({
    mutationFn: async (newRates: Partial<ExchangeRates>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updatedRates = {
        USD: 1,
        EUR: newRates.EUR ?? rates?.EUR ?? DEFAULT_RATES.EUR,
        JOD: newRates.JOD ?? rates?.JOD ?? DEFAULT_RATES.JOD,
      };

      // Try update first
      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', 'exchange_rates')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('app_settings')
          .update({ 
            value: updatedRates as unknown as Json,
            updated_at: new Date().toISOString(),
            updated_by: user?.id 
          })
          .eq('key', 'exchange_rates');

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('app_settings')
          .insert({ 
            key: 'exchange_rates',
            value: updatedRates as unknown as Json,
            updated_at: new Date().toISOString(),
            updated_by: user?.id 
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
    },
  });

  // Convert amount from one currency to another
  const convert = (amount: number, fromCurrency: Currency, toCurrency: Currency): number => {
    if (fromCurrency === toCurrency) return amount;
    
    const currentRates = rates || DEFAULT_RATES;
    
    // Convert to USD first, then to target currency
    const usdAmount = amount / currentRates[fromCurrency];
    return usdAmount * currentRates[toCurrency];
  };

  // Get rate for display (relative to USD)
  const getRate = (currency: Currency): number => {
    return (rates || DEFAULT_RATES)[currency];
  };

  return {
    rates: rates || DEFAULT_RATES,
    isLoading,
    error,
    convert,
    getRate,
    updateRates: updateRatesMutation.mutateAsync,
    isUpdating: updateRatesMutation.isPending,
    canEdit: isAdmin,
  };
}
