import { useMemo } from 'react';
import { useFilteredShipments } from './useFilteredShipments';

export interface ClientAnalytics {
  clientName: string;
  shipmentCount: number;
  completedCount: number;
  equipmentVolume: number;
  totalRevenue: number;
  totalProfit: number;
  conversionRate: number;
}

export function useClientAnalytics() {
  const { shipments, isLoading } = useFilteredShipments();

  const clientAnalytics = useMemo(() => {
    const clientMap = new Map<string, {
      shipmentCount: number;
      completedCount: number;
      equipmentVolume: number;
      totalRevenue: number;
      totalProfit: number;
    }>();

    shipments.forEach((shipment) => {
      const clientName = shipment.clientName?.trim();
      if (!clientName) return;

      const existing = clientMap.get(clientName) || {
        shipmentCount: 0,
        completedCount: 0,
        equipmentVolume: 0,
        totalRevenue: 0,
        totalProfit: 0,
      };

      // Calculate equipment volume from the equipment JSON array
      const equipmentArray = Array.isArray(shipment.equipment) ? shipment.equipment : [];
      const volume = equipmentArray.reduce((sum: number, eq: any) => {
        return sum + (eq.quantity || 0);
      }, 0);

      const isCompleted = shipment.stage === 'completed';

      clientMap.set(clientName, {
        shipmentCount: existing.shipmentCount + 1,
        completedCount: existing.completedCount + (isCompleted ? 1 : 0),
        equipmentVolume: existing.equipmentVolume + volume,
        totalRevenue: existing.totalRevenue + (isCompleted ? (shipment.totalInvoiceAmount || 0) : 0),
        totalProfit: existing.totalProfit + (isCompleted ? (shipment.totalProfit || 0) : 0),
      });
    });

    const analytics: ClientAnalytics[] = Array.from(clientMap.entries()).map(([clientName, data]) => ({
      clientName,
      ...data,
      conversionRate: data.shipmentCount > 0 
        ? Math.round((data.completedCount / data.shipmentCount) * 100) 
        : 0,
    }));

    // Sort by shipment count by default
    return analytics.sort((a, b) => b.shipmentCount - a.shipmentCount);
  }, [shipments]);

  const summary = useMemo(() => {
    if (clientAnalytics.length === 0) {
      return {
        totalClients: 0,
        topByVolume: null,
        topByRevenue: null,
      };
    }

    const topByVolume = [...clientAnalytics].sort((a, b) => b.equipmentVolume - a.equipmentVolume)[0];
    const topByRevenue = [...clientAnalytics].sort((a, b) => b.totalRevenue - a.totalRevenue)[0];

    return {
      totalClients: clientAnalytics.length,
      topByVolume: topByVolume.equipmentVolume > 0 ? topByVolume : null,
      topByRevenue: topByRevenue.totalRevenue > 0 ? topByRevenue : null,
    };
  }, [clientAnalytics]);

  return {
    clientAnalytics,
    summary,
    isLoading,
  };
}
