import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShipmentPayable, PayableWithShipment, PartyType, ShipmentWithPayables } from '@/types/payable';
import { toast } from 'sonner';

interface PayableRow {
  id: string;
  shipment_id: string;
  party_type: string;
  party_name: string;
  estimated_amount: number | null;
  invoice_amount: number | null;
  invoice_file_name: string | null;
  invoice_file_path: string | null;
  invoice_uploaded: boolean | null;
  invoice_date: string | null;
  paid: boolean | null;
  paid_date: string | null;
  currency: string;
  notes: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

interface PayableWithShipmentRow extends PayableRow {
  shipments: {
    reference_id: string;
    port_of_loading: string;
    port_of_discharge: string;
    etd: string | null;
    eta: string | null;
    client_name: string | null;
  };
}

const rowToPayable = (row: PayableRow): ShipmentPayable => ({
  id: row.id,
  shipmentId: row.shipment_id,
  partyType: row.party_type as PartyType,
  partyName: row.party_name,
  estimatedAmount: row.estimated_amount,
  invoiceAmount: row.invoice_amount,
  invoiceFileName: row.invoice_file_name,
  invoiceFilePath: row.invoice_file_path,
  invoiceUploaded: row.invoice_uploaded ?? false,
  invoiceDate: row.invoice_date,
  paid: row.paid ?? false,
  paidDate: row.paid_date,
  currency: row.currency,
  notes: row.notes,
  dueDate: row.due_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const rowToPayableWithShipment = (row: PayableWithShipmentRow): PayableWithShipment => ({
  ...rowToPayable(row),
  referenceId: row.shipments.reference_id,
  portOfLoading: row.shipments.port_of_loading,
  portOfDischarge: row.shipments.port_of_discharge,
  etd: row.shipments.etd,
  eta: row.shipments.eta,
  clientName: row.shipments.client_name,
});

export function useShipmentPayables(shipmentId?: string) {
  const queryClient = useQueryClient();

  // Fetch payables for a specific shipment
  const { data: payables = [], isLoading } = useQuery({
    queryKey: ['shipment-payables', shipmentId],
    queryFn: async () => {
      if (!shipmentId) return [];
      const { data, error } = await supabase
        .from('shipment_payables')
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return (data as PayableRow[]).map(rowToPayable);
    },
    enabled: !!shipmentId,
  });

  // Add a new payable
  const addPayable = useMutation({
    mutationFn: async (data: {
      shipmentId: string;
      partyType: PartyType;
      partyName: string;
      estimatedAmount?: number;
      currency?: string;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('shipment_payables')
        .insert({
          shipment_id: data.shipmentId,
          party_type: data.partyType,
          party_name: data.partyName,
          estimated_amount: data.estimatedAmount,
          currency: data.currency || 'USD',
          notes: data.notes,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipment-payables'] });
      queryClient.invalidateQueries({ queryKey: ['all-pending-payables'] });
      queryClient.invalidateQueries({ queryKey: ['shipments-with-payables'] });
      toast.success('Payable added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add payable: ' + error.message);
    },
  });

  // Update a payable (for invoice upload)
  const updatePayable = useMutation({
    mutationFn: async (data: {
      id: string;
      invoiceAmount?: number;
      invoiceFileName?: string;
      invoiceFilePath?: string;
      invoiceUploaded?: boolean;
      invoiceDate?: string;
    }) => {
      const { error } = await supabase
        .from('shipment_payables')
        .update({
          invoice_amount: data.invoiceAmount,
          invoice_file_name: data.invoiceFileName,
          invoice_file_path: data.invoiceFilePath,
          invoice_uploaded: data.invoiceUploaded,
          invoice_date: data.invoiceDate,
        })
        .eq('id', data.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipment-payables'] });
      queryClient.invalidateQueries({ queryKey: ['all-pending-payables'] });
      queryClient.invalidateQueries({ queryKey: ['shipments-with-payables'] });
      toast.success('Invoice saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to save invoice: ' + error.message);
    },
  });

  // Edit payable details (party info, due date, etc.)
  const editPayable = useMutation({
    mutationFn: async (data: {
      id: string;
      partyType: PartyType;
      partyName: string;
      estimatedAmount: number | null;
      currency: string;
      notes: string | null;
      dueDate: string | null;
    }) => {
      const { error } = await supabase
        .from('shipment_payables')
        .update({
          party_type: data.partyType,
          party_name: data.partyName,
          estimated_amount: data.estimatedAmount,
          currency: data.currency,
          notes: data.notes,
          due_date: data.dueDate,
        })
        .eq('id', data.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipment-payables'] });
      queryClient.invalidateQueries({ queryKey: ['all-pending-payables'] });
      queryClient.invalidateQueries({ queryKey: ['shipments-with-payables'] });
      toast.success('Payable updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update payable: ' + error.message);
    },
  });

  // Mark as paid
  const markAsPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shipment_payables')
        .update({
          paid: true,
          paid_date: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipment-payables'] });
      queryClient.invalidateQueries({ queryKey: ['all-pending-payables'] });
      queryClient.invalidateQueries({ queryKey: ['shipments-with-payables'] });
      toast.success('Marked as paid');
    },
    onError: (error) => {
      toast.error('Failed to mark as paid: ' + error.message);
    },
  });

  // Undo payment
  const undoPayment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shipment_payables')
        .update({
          paid: false,
          paid_date: null,
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipment-payables'] });
      queryClient.invalidateQueries({ queryKey: ['all-pending-payables'] });
      queryClient.invalidateQueries({ queryKey: ['shipments-with-payables'] });
      toast.success('Payment undone');
    },
    onError: (error) => {
      toast.error('Failed to undo payment: ' + error.message);
    },
  });

  // Delete a payable
  const deletePayable = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shipment_payables')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipment-payables'] });
      queryClient.invalidateQueries({ queryKey: ['all-pending-payables'] });
      queryClient.invalidateQueries({ queryKey: ['shipments-with-payables'] });
      toast.success('Payable deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete payable: ' + error.message);
    },
  });

  // Get signed URL for viewing invoice
  const getInvoiceUrl = async (filePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from('payable-invoices')
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    
    if (error) {
      console.error('Error getting invoice URL:', error);
      return null;
    }
    return data.signedUrl;
  };

  return {
    payables,
    isLoading,
    addPayable,
    updatePayable,
    editPayable,
    markAsPaid,
    undoPayment,
    deletePayable,
    getInvoiceUrl,
  };
}

// Hook to fetch all pending payables across all shipments
export function useAllPendingPayables(showHistory = false) {
  return useQuery({
    queryKey: ['all-pending-payables', showHistory],
    queryFn: async () => {
      let query = supabase
        .from('shipment_payables')
        .select(`
          *,
          shipments!inner (
            reference_id,
            port_of_loading,
            port_of_discharge,
            etd,
            eta,
            client_name
          )
        `)
        .order('created_at', { ascending: false });

      if (!showHistory) {
        query = query.eq('paid', false);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return (data as PayableWithShipmentRow[]).map(rowToPayableWithShipment);
    },
  });
}

// Hook to fetch all shipments with their payables grouped
export function useShipmentsWithPayables(showHistory = false) {
  return useQuery({
    queryKey: ['shipments-with-payables', showHistory],
    queryFn: async () => {
      // Fetch shipments that have ETD or ETA set (indicating they're ready for payables tracking)
      const { data: shipments, error: shipmentsError } = await supabase
        .from('shipments')
        .select('id, reference_id, client_name, port_of_loading, port_of_discharge, etd, eta, salesperson, pricing_owner, ops_owner, stage')
        .or('etd.not.is.null,eta.not.is.null')
        .order('created_at', { ascending: false });

      if (shipmentsError) throw shipmentsError;

      // Fetch all payables
      let payablesQuery = supabase
        .from('shipment_payables')
        .select('*')
        .order('created_at', { ascending: true });

      const { data: payables, error: payablesError } = await payablesQuery;

      if (payablesError) throw payablesError;

      // Group payables by shipment
      const payablesByShipment = new Map<string, ShipmentPayable[]>();
      (payables as PayableRow[]).forEach((row) => {
        const payable = rowToPayable(row);
        const existing = payablesByShipment.get(row.shipment_id) || [];
        existing.push(payable);
        payablesByShipment.set(row.shipment_id, existing);
      });

      // Build the result
      const result: ShipmentWithPayables[] = shipments.map((s) => {
        const shipmentPayables = payablesByShipment.get(s.id) || [];
        const pendingPayables = shipmentPayables.filter((p) => !p.paid);
        const paidPayables = shipmentPayables.filter((p) => p.paid);

        // Calculate total outstanding (pending only)
        const totalOutstanding = pendingPayables.reduce((sum, p) => {
          return sum + (p.invoiceAmount ?? p.estimatedAmount ?? 0);
        }, 0);

        return {
          id: s.id,
          referenceId: s.reference_id,
          clientName: s.client_name,
          portOfLoading: s.port_of_loading,
          portOfDischarge: s.port_of_discharge,
          etd: s.etd,
          eta: s.eta,
          salesperson: s.salesperson,
          pricingOwner: s.pricing_owner,
          opsOwner: s.ops_owner,
          payables: shipmentPayables,
          totalOutstanding,
          paidCount: paidPayables.length,
          pendingCount: pendingPayables.length,
        };
      });

      // Filter based on showHistory
      if (!showHistory) {
        // Show shipments that have pending payables OR no payables yet
        return result.filter((s) => s.pendingCount > 0 || s.payables.length === 0);
      }

      return result;
    },
  });
}
