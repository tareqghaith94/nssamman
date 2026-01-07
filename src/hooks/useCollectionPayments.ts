import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Currency } from '@/types/shipment';

export interface CollectionPayment {
  id: string;
  shipmentId: string;
  amount: number;
  currency: Currency;
  paymentDate: Date;
  paymentMethod?: string;
  notes?: string;
  createdAt: Date;
  createdBy?: string;
}

interface PaymentRow {
  id: string;
  shipment_id: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

const rowToPayment = (row: PaymentRow): CollectionPayment => ({
  id: row.id,
  shipmentId: row.shipment_id,
  amount: Number(row.amount),
  currency: row.currency as Currency,
  paymentDate: new Date(row.payment_date),
  paymentMethod: row.payment_method || undefined,
  notes: row.notes || undefined,
  createdAt: new Date(row.created_at),
  createdBy: row.created_by || undefined,
});

export function useCollectionPayments(shipmentId?: string) {
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['collection-payments', shipmentId],
    queryFn: async () => {
      if (!shipmentId) return [];
      
      const { data, error } = await supabase
        .from('collection_payments')
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return (data as PaymentRow[]).map(rowToPayment);
    },
    enabled: !!shipmentId,
  });

  const addPaymentMutation = useMutation({
    mutationFn: async (payment: {
      shipmentId: string;
      amount: number;
      currency: Currency;
      paymentDate: Date;
      paymentMethod?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('collection_payments')
        .insert({
          shipment_id: payment.shipmentId,
          amount: payment.amount,
          currency: payment.currency,
          payment_date: payment.paymentDate.toISOString(),
          payment_method: payment.paymentMethod,
          notes: payment.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return rowToPayment(data as PaymentRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-payments'] });
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from('collection_payments')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-payments'] });
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    },
  });

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  return {
    payments,
    isLoading,
    totalCollected,
    addPayment: addPaymentMutation.mutateAsync,
    deletePayment: deletePaymentMutation.mutateAsync,
    isAdding: addPaymentMutation.isPending,
  };
}
