import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Shipment, ShipmentStage, EquipmentItem } from '@/types/shipment';
import { toast } from 'sonner';

// Type for database row (snake_case) - using unknown for equipment since Supabase returns Json type
interface ShipmentRow {
  id: string;
  reference_id: string;
  salesperson: string;
  port_of_loading: string;
  port_of_discharge: string;
  equipment: unknown;
  mode_of_transport: string;
  payment_terms: string;
  incoterm: string;
  stage: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  agent: string | null;
  selling_price_per_unit: number | null;
  cost_per_unit: number | null;
  profit_per_unit: number | null;
  total_selling_price: number | null;
  total_cost: number | null;
  total_profit: number | null;
  nss_booking_reference: string | null;
  nss_invoice_number: string | null;
  bl_type: string | null;
  bl_draft_approval: boolean | null;
  final_bl_issued: boolean | null;
  terminal_cutoff: string | null;
  gate_in_terminal: string | null;
  etd: string | null;
  eta: string | null;
  arrival_notice_sent: boolean | null;
  do_issued: boolean | null;
  do_release_date: string | null;
  total_invoice_amount: number | null;
  completed_at: string | null;
  ops_owner: string | null;
  payment_collected: boolean | null;
  payment_collected_date: string | null;
  agent_paid: boolean | null;
  agent_paid_date: string | null;
  agent_invoice_uploaded: boolean | null;
  agent_invoice_file_name: string | null;
  agent_invoice_amount: number | null;
  agent_invoice_date: string | null;
  is_lost: boolean | null;
  lost_reason: string | null;
  lost_at: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseEquipment(equipment: any): EquipmentItem[] {
  if (Array.isArray(equipment)) {
    return equipment as EquipmentItem[];
  }
  return [];
}

// Convert database row to frontend Shipment type
function rowToShipment(row: ShipmentRow): Shipment {
  return {
    id: row.id,
    referenceId: row.reference_id,
    salesperson: row.salesperson,
    portOfLoading: row.port_of_loading,
    portOfDischarge: row.port_of_discharge,
    equipment: Array.isArray(row.equipment) ? row.equipment : [],
    modeOfTransport: row.mode_of_transport as Shipment['modeOfTransport'],
    paymentTerms: row.payment_terms as Shipment['paymentTerms'],
    incoterm: row.incoterm as Shipment['incoterm'],
    stage: row.stage as ShipmentStage,
    createdAt: new Date(row.created_at),
    agent: row.agent ?? undefined,
    sellingPricePerUnit: row.selling_price_per_unit ?? undefined,
    costPerUnit: row.cost_per_unit ?? undefined,
    profitPerUnit: row.profit_per_unit ?? undefined,
    totalSellingPrice: row.total_selling_price ?? undefined,
    totalCost: row.total_cost ?? undefined,
    totalProfit: row.total_profit ?? undefined,
    nssBookingReference: row.nss_booking_reference ?? undefined,
    nssInvoiceNumber: row.nss_invoice_number ?? undefined,
    blType: row.bl_type as Shipment['blType'] ?? undefined,
    blDraftApproval: row.bl_draft_approval ?? undefined,
    finalBLIssued: row.final_bl_issued ?? undefined,
    terminalCutoff: row.terminal_cutoff ? new Date(row.terminal_cutoff) : undefined,
    gateInTerminal: row.gate_in_terminal ? new Date(row.gate_in_terminal) : undefined,
    etd: row.etd ? new Date(row.etd) : undefined,
    eta: row.eta ? new Date(row.eta) : undefined,
    arrivalNoticeSent: row.arrival_notice_sent ?? undefined,
    doIssued: row.do_issued ?? undefined,
    doReleaseDate: row.do_release_date ? new Date(row.do_release_date) : undefined,
    totalInvoiceAmount: row.total_invoice_amount ?? undefined,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    opsOwner: row.ops_owner as Shipment['opsOwner'] ?? undefined,
    paymentCollected: row.payment_collected ?? undefined,
    paymentCollectedDate: row.payment_collected_date ? new Date(row.payment_collected_date) : undefined,
    agentPaid: row.agent_paid ?? undefined,
    agentPaidDate: row.agent_paid_date ? new Date(row.agent_paid_date) : undefined,
    agentInvoiceUploaded: row.agent_invoice_uploaded ?? undefined,
    agentInvoiceFileName: row.agent_invoice_file_name ?? undefined,
    agentInvoiceAmount: row.agent_invoice_amount ?? undefined,
    agentInvoiceDate: row.agent_invoice_date ? new Date(row.agent_invoice_date) : undefined,
    isLost: row.is_lost ?? undefined,
    lostReason: row.lost_reason as Shipment['lostReason'] ?? undefined,
    lostAt: row.lost_at ? new Date(row.lost_at) : undefined,
  };
}

// Convert frontend Shipment to database format
function shipmentToRow(shipment: Partial<Shipment>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  
  if (shipment.salesperson !== undefined) row.salesperson = shipment.salesperson;
  if (shipment.portOfLoading !== undefined) row.port_of_loading = shipment.portOfLoading;
  if (shipment.portOfDischarge !== undefined) row.port_of_discharge = shipment.portOfDischarge;
  if (shipment.equipment !== undefined) row.equipment = shipment.equipment;
  if (shipment.modeOfTransport !== undefined) row.mode_of_transport = shipment.modeOfTransport;
  if (shipment.paymentTerms !== undefined) row.payment_terms = shipment.paymentTerms;
  if (shipment.incoterm !== undefined) row.incoterm = shipment.incoterm;
  if (shipment.stage !== undefined) row.stage = shipment.stage;
  if (shipment.agent !== undefined) row.agent = shipment.agent;
  if (shipment.sellingPricePerUnit !== undefined) row.selling_price_per_unit = shipment.sellingPricePerUnit;
  if (shipment.costPerUnit !== undefined) row.cost_per_unit = shipment.costPerUnit;
  if (shipment.profitPerUnit !== undefined) row.profit_per_unit = shipment.profitPerUnit;
  if (shipment.totalSellingPrice !== undefined) row.total_selling_price = shipment.totalSellingPrice;
  if (shipment.totalCost !== undefined) row.total_cost = shipment.totalCost;
  if (shipment.totalProfit !== undefined) row.total_profit = shipment.totalProfit;
  if (shipment.nssBookingReference !== undefined) row.nss_booking_reference = shipment.nssBookingReference;
  if (shipment.nssInvoiceNumber !== undefined) row.nss_invoice_number = shipment.nssInvoiceNumber;
  if (shipment.blType !== undefined) row.bl_type = shipment.blType;
  if (shipment.blDraftApproval !== undefined) row.bl_draft_approval = shipment.blDraftApproval;
  if (shipment.finalBLIssued !== undefined) row.final_bl_issued = shipment.finalBLIssued;
  if (shipment.terminalCutoff !== undefined) row.terminal_cutoff = shipment.terminalCutoff?.toISOString();
  if (shipment.gateInTerminal !== undefined) row.gate_in_terminal = shipment.gateInTerminal?.toISOString();
  if (shipment.etd !== undefined) row.etd = shipment.etd?.toISOString();
  if (shipment.eta !== undefined) row.eta = shipment.eta?.toISOString();
  if (shipment.arrivalNoticeSent !== undefined) row.arrival_notice_sent = shipment.arrivalNoticeSent;
  if (shipment.doIssued !== undefined) row.do_issued = shipment.doIssued;
  if (shipment.doReleaseDate !== undefined) row.do_release_date = shipment.doReleaseDate?.toISOString();
  if (shipment.totalInvoiceAmount !== undefined) row.total_invoice_amount = shipment.totalInvoiceAmount;
  if (shipment.completedAt !== undefined) row.completed_at = shipment.completedAt?.toISOString();
  if (shipment.opsOwner !== undefined) row.ops_owner = shipment.opsOwner;
  if (shipment.paymentCollected !== undefined) row.payment_collected = shipment.paymentCollected;
  if (shipment.paymentCollectedDate !== undefined) row.payment_collected_date = shipment.paymentCollectedDate?.toISOString();
  if (shipment.agentPaid !== undefined) row.agent_paid = shipment.agentPaid;
  if (shipment.agentPaidDate !== undefined) row.agent_paid_date = shipment.agentPaidDate?.toISOString();
  if (shipment.agentInvoiceUploaded !== undefined) row.agent_invoice_uploaded = shipment.agentInvoiceUploaded;
  if (shipment.agentInvoiceFileName !== undefined) row.agent_invoice_file_name = shipment.agentInvoiceFileName;
  if (shipment.agentInvoiceAmount !== undefined) row.agent_invoice_amount = shipment.agentInvoiceAmount;
  if (shipment.agentInvoiceDate !== undefined) row.agent_invoice_date = shipment.agentInvoiceDate?.toISOString();
  if (shipment.isLost !== undefined) row.is_lost = shipment.isLost;
  if (shipment.lostReason !== undefined) row.lost_reason = shipment.lostReason;
  if (shipment.lostAt !== undefined) row.lost_at = shipment.lostAt?.toISOString();
  
  return row;
}

export function useShipments() {
  const queryClient = useQueryClient();
  const { user, session } = useAuth();

  // Fetch all shipments - start as soon as session exists (parallel with profile/roles)
  const { data: shipments = [], isLoading, error, refetch } = useQuery({
    queryKey: ['shipments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data as ShipmentRow[]).map(rowToShipment);
    },
    enabled: !!session,
  });

  // Add shipment mutation
  const addShipmentMutation = useMutation({
    mutationFn: async (shipmentData: Omit<Shipment, 'id' | 'referenceId' | 'createdAt' | 'stage'>) => {
      // First generate the reference ID server-side
      const { data: refIdData, error: refIdError } = await supabase
        .rpc('generate_reference_id', { p_salesperson: shipmentData.salesperson });
      
      if (refIdError) throw refIdError;
      
      const insertData = {
        ...shipmentToRow(shipmentData),
        reference_id: refIdData,
        stage: 'lead',
        created_by: user?.id,
      };
      
      const { data, error } = await supabase
        .from('shipments')
        .insert(insertData as never)
        .select()
        .single();
      
      if (error) throw error;
      return rowToShipment(data as ShipmentRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    },
    onError: (error) => {
      console.error('Error adding shipment:', error);
      toast.error('Failed to create shipment');
    },
  });

  // Update shipment mutation
  const updateShipmentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Shipment> }) => {
      const { data, error } = await supabase
        .from('shipments')
        .update(shipmentToRow(updates))
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return rowToShipment(data as ShipmentRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    },
    onError: (error) => {
      console.error('Error updating shipment:', error);
      toast.error('Failed to update shipment');
    },
  });

  // Move to stage mutation
  const moveToStageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: ShipmentStage }) => {
      const updates: Record<string, unknown> = { stage };
      if (stage === 'completed') {
        updates.completed_at = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('shipments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return rowToShipment(data as ShipmentRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    },
    onError: (error) => {
      console.error('Error moving shipment to stage:', error);
      toast.error('Failed to update shipment stage');
    },
  });

  // Delete all shipments mutation (admin only)
  const clearAllShipmentsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('shipments')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    },
    onError: (error) => {
      console.error('Error clearing shipments:', error);
      toast.error('Failed to clear shipments');
    },
  });

  // Helper functions
  const addShipment = (shipmentData: Omit<Shipment, 'id' | 'referenceId' | 'createdAt' | 'stage'>) => {
    return addShipmentMutation.mutateAsync(shipmentData);
  };

  const updateShipment = (id: string, updates: Partial<Shipment>) => {
    return updateShipmentMutation.mutateAsync({ id, updates });
  };

  const moveToStage = (id: string, stage: ShipmentStage) => {
    return moveToStageMutation.mutateAsync({ id, stage });
  };

  const clearAllShipments = () => {
    return clearAllShipmentsMutation.mutateAsync();
  };

  const getShipmentsByStage = (stage: ShipmentStage) => {
    return shipments.filter((s) => s.stage === stage);
  };

  return {
    shipments,
    isLoading,
    error,
    refetch,
    addShipment,
    updateShipment,
    moveToStage,
    clearAllShipments,
    getShipmentsByStage,
    isAdding: addShipmentMutation.isPending,
    isUpdating: updateShipmentMutation.isPending,
  };
}
