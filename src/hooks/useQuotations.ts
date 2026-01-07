import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Quotation, QuoteLineItem } from '@/types/quotation';
import { EquipmentItem, ModeOfTransport } from '@/types/shipment';
import { Json } from '@/integrations/supabase/types';

interface QuotationRow {
  id: string;
  shipment_id: string;
  client_name: string;
  client_address: string | null;
  pol: string;
  pod: string;
  mode_of_transport: string;
  equipment: Json;
  ocean_freight_amount: number | null;
  exw_amount: number | null;
  exw_qty: number | null;
  remarks: string | null;
  status: string;
  valid_until: string | null;
  created_at: string;
  created_by: string | null;
  issued_at: string | null;
}

interface LineItemRow {
  id: string;
  quotation_id: string;
  description: string;
  equipment_type: string | null;
  unit_cost: number;
  quantity: number;
  amount: number;
  currency: string;
}

function rowToQuotation(row: QuotationRow & { shipments?: { reference_id: string } | null }): Quotation {
  return {
    id: row.id,
    referenceId: row.shipments?.reference_id || '',
    shipmentId: row.shipment_id,
    clientName: row.client_name,
    clientAddress: row.client_address || undefined,
    pol: row.pol,
    pod: row.pod,
    modeOfTransport: row.mode_of_transport as ModeOfTransport,
    equipment: (row.equipment as unknown as EquipmentItem[]) || [],
    oceanFreightAmount: row.ocean_freight_amount || undefined,
    exwAmount: row.exw_amount || undefined,
    exwQty: row.exw_qty || undefined,
    remarks: row.remarks || undefined,
    status: row.status as Quotation['status'],
    validUntil: row.valid_until ? new Date(row.valid_until) : undefined,
    createdAt: new Date(row.created_at),
    createdBy: row.created_by || undefined,
    issuedAt: row.issued_at ? new Date(row.issued_at) : undefined,
  };
}

function rowToLineItem(row: LineItemRow): QuoteLineItem {
  return {
    id: row.id,
    quotationId: row.quotation_id,
    description: row.description,
    equipmentType: row.equipment_type || undefined,
    unitCost: row.unit_cost,
    quantity: row.quantity,
    amount: row.amount,
    currency: row.currency || 'USD',
  };
}

export function useQuotations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: quotations = [], isLoading, error } = useQuery({
    queryKey: ['quotations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select('*, shipments(reference_id)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data as (QuotationRow & { shipments?: { reference_id: string } | null })[]).map(rowToQuotation);
    },
    enabled: !!user,
  });

  const createQuotationMutation = useMutation({
    mutationFn: async (quotation: Omit<Quotation, 'id' | 'referenceId' | 'createdAt'> & { lineItems?: Omit<QuoteLineItem, 'id' | 'quotationId' | 'amount'>[] }) => {
      if (!quotation.shipmentId) {
        throw new Error('Quotations must be linked to a shipment');
      }

      const { lineItems, ...quotationData } = quotation;

      const { data, error } = await supabase
        .from('quotations')
        .insert({
          shipment_id: quotationData.shipmentId,
          client_name: quotationData.clientName,
          client_address: quotationData.clientAddress || null,
          pol: quotationData.pol,
          pod: quotationData.pod,
          mode_of_transport: quotationData.modeOfTransport,
          equipment: quotationData.equipment as unknown as Json,
          ocean_freight_amount: quotationData.oceanFreightAmount || null,
          exw_amount: quotationData.exwAmount || null,
          exw_qty: quotationData.exwQty || null,
          remarks: quotationData.remarks || null,
          status: quotationData.status,
          valid_until: quotationData.validUntil?.toISOString() || null,
          created_by: user?.id,
          issued_at: quotationData.issuedAt?.toISOString() || null,
        })
        .select('*, shipments(reference_id)')
        .single();

      if (error) throw error;

      // Insert line items if provided
      if (lineItems && lineItems.length > 0) {
        const { error: lineError } = await supabase
          .from('quote_line_items')
          .insert(lineItems.map(item => ({
            quotation_id: data.id,
            description: item.description,
            equipment_type: item.equipmentType || null,
            unit_cost: item.unitCost,
            quantity: item.quantity,
            currency: item.currency || 'USD',
          })));

        if (lineError) throw lineError;
      }

      return rowToQuotation(data as QuotationRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });

  const updateQuotationMutation = useMutation({
    mutationFn: async ({ id, lineItems, ...updates }: Partial<Quotation> & { id: string; lineItems?: Omit<QuoteLineItem, 'id' | 'quotationId' | 'amount'>[] }) => {
      const { data, error } = await supabase
        .from('quotations')
        .update({
          client_name: updates.clientName,
          client_address: updates.clientAddress || null,
          pol: updates.pol,
          pod: updates.pod,
          mode_of_transport: updates.modeOfTransport,
          equipment: updates.equipment as unknown as Json,
          ocean_freight_amount: updates.oceanFreightAmount || null,
          exw_amount: updates.exwAmount || null,
          exw_qty: updates.exwQty || null,
          remarks: updates.remarks || null,
          status: updates.status,
          valid_until: updates.validUntil?.toISOString() || null,
          issued_at: updates.issuedAt?.toISOString() || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update line items if provided
      if (lineItems && lineItems.length > 0) {
        // Delete existing line items
        await supabase
          .from('quote_line_items')
          .delete()
          .eq('quotation_id', id);

        // Insert new line items
        const { error: lineError } = await supabase
          .from('quote_line_items')
          .insert(lineItems.map(item => ({
            quotation_id: id,
            description: item.description,
            equipment_type: item.equipmentType || null,
            unit_cost: item.unitCost,
            quantity: item.quantity,
            currency: item.currency || 'USD',
          })));

        if (lineError) throw lineError;
      }

      return rowToQuotation(data as QuotationRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });

  const issueQuotationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('quotations')
        .update({
          status: 'issued',
          issued_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return rowToQuotation(data as QuotationRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });

  const fetchLineItems = useCallback(async (quotationId: string): Promise<QuoteLineItem[]> => {
    const { data, error } = await supabase
      .from('quote_line_items')
      .select('*')
      .eq('quotation_id', quotationId);

    if (error) throw error;
    return (data as LineItemRow[]).map(rowToLineItem);
  }, []);

  return {
    quotations,
    isLoading,
    error,
    createQuotation: createQuotationMutation.mutateAsync,
    updateQuotation: updateQuotationMutation.mutateAsync,
    issueQuotation: issueQuotationMutation.mutateAsync,
    fetchLineItems,
    isCreating: createQuotationMutation.isPending,
    isUpdating: updateQuotationMutation.isPending,
  };
}
