import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CostLineItem {
  id: string;
  shipmentId: string;
  description: string;
  equipmentType?: string;
  unitCost: number;
  quantity: number;
  amount: number;
}

interface CostLineItemRow {
  id: string;
  shipment_id: string;
  description: string;
  equipment_type: string | null;
  unit_cost: number;
  quantity: number;
  amount: number | null;
}

function rowToCostLineItem(row: CostLineItemRow): CostLineItem {
  return {
    id: row.id,
    shipmentId: row.shipment_id,
    description: row.description,
    equipmentType: row.equipment_type || undefined,
    unitCost: row.unit_cost,
    quantity: row.quantity,
    amount: row.amount || row.unit_cost * row.quantity,
  };
}

export function useCostLineItems() {
  const fetchCostLineItems = useCallback(async (shipmentId: string): Promise<CostLineItem[]> => {
    const { data, error } = await supabase
      .from('cost_line_items')
      .select('*')
      .eq('shipment_id', shipmentId);

    if (error) throw error;
    return (data as CostLineItemRow[]).map(rowToCostLineItem);
  }, []);

  const saveCostLineItems = useCallback(async (
    shipmentId: string,
    items: Omit<CostLineItem, 'id' | 'shipmentId' | 'amount'>[]
  ): Promise<void> => {
    // Delete existing cost line items for this shipment
    await supabase
      .from('cost_line_items')
      .delete()
      .eq('shipment_id', shipmentId);

    // Insert new cost line items
    if (items.length > 0) {
      const { error } = await supabase
        .from('cost_line_items')
        .insert(items.map(item => ({
          shipment_id: shipmentId,
          description: item.description,
          equipment_type: item.equipmentType || null,
          unit_cost: item.unitCost,
          quantity: item.quantity,
          amount: item.unitCost * item.quantity,
        })));

      if (error) throw error;
    }
  }, []);

  return {
    fetchCostLineItems,
    saveCostLineItems,
  };
}
