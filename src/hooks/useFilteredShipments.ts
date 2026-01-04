import { useMemo } from 'react';
import { useShipments } from '@/hooks/useShipments';
import { useAuth } from '@/hooks/useAuth';
import { canSeeShipment } from '@/lib/permissions';
import { Shipment } from '@/types/shipment';
import { UserRole } from '@/types/permissions';

/**
 * Hook that returns shipments filtered by the current user's permissions.
 * Sales users only see their own shipments (by ref prefix).
 * Other roles see all shipments.
 */
export function useFilteredShipments(): { shipments: Shipment[]; isLoading: boolean } {
  const { shipments: allShipments, isLoading } = useShipments();
  const { profile, roles } = useAuth();
  
  // Use roles from auth (database) for proper permission checking
  const userRoles = (roles || []) as UserRole[];
  const refPrefix = profile?.ref_prefix || undefined;
  
  const shipments = useMemo(() => {
    // If no roles yet (loading), show nothing
    if (userRoles.length === 0) return [];
    
    return allShipments.filter((shipment) => 
      canSeeShipment(shipment, userRoles, refPrefix)
    );
  }, [allShipments, userRoles, refPrefix]);

  return { shipments, isLoading };
}
