import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY_PREFIX = 'lastSeenShipments_';

interface LastSeenData {
  timestamp: number;
  shipmentIds: string[];
}

/**
 * Hook to track which shipments have been seen in a specific stage.
 * New shipments (those not in the last seen list) will be highlighted.
 */
export function useLastSeenShipments(stage: string) {
  const storageKey = `${STORAGE_KEY_PREFIX}${stage}`;
  const [lastSeenData, setLastSeenData] = useState<LastSeenData | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setLastSeenData(JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    }
  }, [storageKey]);

  // Mark shipments as seen
  const markAsSeen = useCallback((shipmentIds: string[]) => {
    const newData: LastSeenData = {
      timestamp: Date.now(),
      shipmentIds,
    };
    setLastSeenData(newData);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newData));
    } catch {
      // Ignore storage errors
    }
  }, [storageKey]);

  // Check if a shipment is new (wasn't in the last seen list)
  const isNewShipment = useCallback((shipmentId: string): boolean => {
    if (!lastSeenData) return false; // First visit, don't highlight anything
    return !lastSeenData.shipmentIds.includes(shipmentId);
  }, [lastSeenData]);

  return { isNewShipment, markAsSeen, lastSeenTimestamp: lastSeenData?.timestamp };
}
