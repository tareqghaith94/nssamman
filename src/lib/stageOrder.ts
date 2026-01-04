import { ShipmentStage } from '@/types/shipment';

// Stage order for filtering "all that reached this stage or beyond"
export const STAGE_ORDER: ShipmentStage[] = ['lead', 'pricing', 'confirmed', 'operations', 'completed'];

export function hasReachedStage(currentStage: ShipmentStage, targetStage: ShipmentStage): boolean {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  const targetIndex = STAGE_ORDER.indexOf(targetStage);
  return currentIndex >= targetIndex;
}
