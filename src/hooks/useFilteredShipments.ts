import { useMemo } from 'react';
import { useShipmentStore } from '@/store/shipmentStore';
import { useUserStore } from '@/store/userStore';
import { canSeeShipment } from '@/lib/permissions';
import { Shipment } from '@/types/shipment';
import { UserRole } from '@/types/permissions';

/**
 * Hook that returns shipments filtered by the current user's permissions.
 * Sales users only see their own shipments (by ref prefix).
 * Other roles see all shipments.
 */
export function useFilteredShipments(): Shipment[] {
  const allShipments = useShipmentStore((s) => s.shipments);
  const currentUser = useUserStore((s) => s.currentUser);
  
  // Use roles array for multi-role support
  const userRoles = (currentUser.roles || [currentUser.role]) as UserRole[];
  
  return useMemo(() => {
    return allShipments.filter((shipment) => 
      canSeeShipment(shipment, userRoles, currentUser.refPrefix)
    );
  }, [allShipments, userRoles, currentUser.refPrefix]);
}
