import { ShipmentStage } from '@/types/shipment';

// Single source of truth for stage order
// Master definition - array format (for iteration)
export const STAGE_ORDER: ShipmentStage[] = ['lead', 'pricing', 'confirmed', 'operations', 'completed'];

// Derived object format (for index lookups)
export const STAGE_ORDER_MAP: Record<ShipmentStage, number> = STAGE_ORDER.reduce(
  (acc, stage, index) => ({ ...acc, [stage]: index }),
  {} as Record<ShipmentStage, number>
);

export function hasReachedStage(currentStage: ShipmentStage, targetStage: ShipmentStage): boolean {
  const currentIndex = STAGE_ORDER_MAP[currentStage];
  const targetIndex = STAGE_ORDER_MAP[targetStage];
  return currentIndex >= targetIndex;
}
