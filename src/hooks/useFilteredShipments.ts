import { useMemo } from 'react';
import { useShipmentStore } from '@/store/shipmentStore';
import { useAuth } from '@/hooks/useAuth';
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
  const { profile, roles } = useAuth();
  
  // Use roles from auth (database) for proper permission checking
  const userRoles = (roles || []) as UserRole[];
  const refPrefix = profile?.ref_prefix || undefined;
  
  return useMemo(() => {
    // If no roles yet (loading), show nothing
    if (userRoles.length === 0) return [];
    
    return allShipments.filter((shipment) => 
      canSeeShipment(shipment, userRoles, refPrefix)
    );
  }, [allShipments, userRoles, refPrefix]);
}
