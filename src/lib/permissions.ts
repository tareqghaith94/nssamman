import { Shipment, ShipmentStage } from '@/types/shipment';
import { UserRole, PAGE_PERMISSIONS, FIELD_LOCK_RULES, VALID_TRANSITIONS } from '@/types/permissions';
import { STAGE_ORDER_MAP } from '@/lib/stageOrder';

// Check if a user role can access a specific page
export function canAccessPage(role: UserRole, path: string): boolean {
  const allowedPaths = PAGE_PERMISSIONS[role];
  return allowedPaths.includes(path);
}

// Check if a shipment can be edited at all
export function canEditShipment(shipment: Shipment, role: UserRole): boolean {
  // Completed shipments are read-only for everyone except admin
  if (shipment.stage === 'completed' && role !== 'admin') {
    return false;
  }
  
  // Lost shipments are read-only
  if (shipment.isLost) {
    return false;
  }
  
  return true;
}

// Check if a specific field is locked based on shipment stage
export function isFieldLocked(shipment: Shipment, fieldName: string): boolean {
  const lockAfterStage = FIELD_LOCK_RULES[fieldName];
  
  if (!lockAfterStage) {
    // Field has no lock rules - check if shipment is completed
    return shipment.stage === 'completed';
  }
  
  const currentStageOrder = STAGE_ORDER_MAP[shipment.stage];
  const lockStageOrder = STAGE_ORDER_MAP[lockAfterStage as ShipmentStage];
  
  // Field is locked if current stage is at or past the lock stage
  return currentStageOrder >= lockStageOrder;
}

// Get all locked fields for a shipment
export function getLockedFields(shipment: Shipment): string[] {
  return Object.keys(FIELD_LOCK_RULES).filter((field) => 
    isFieldLocked(shipment, field)
  );
}

// Check if a stage transition is valid
export function canMoveToStage(shipment: Shipment, targetStage: ShipmentStage): boolean {
  const validTargets = VALID_TRANSITIONS[shipment.stage];
  return validTargets.includes(targetStage);
}

// Get the reason why a field is locked
export function getFieldLockReason(fieldName: string): string {
  const lockAfterStage = FIELD_LOCK_RULES[fieldName];
  
  if (!lockAfterStage) {
    return 'This field is locked after completion';
  }
  
  const stageNames: Record<string, string> = {
    confirmed: 'Confirmed',
    operations: 'Operations',
    completed: 'Completed',
  };
  
  return `This field is locked after ${stageNames[lockAfterStage] || lockAfterStage} stage`;
}

// Check if user can edit based on role and page
export function canEditOnPage(role: UserRole, page: string): boolean {
  // Admin can edit everything
  if (role === 'admin') return true;
  
  // Role-specific edit permissions
  const editPermissions: Record<UserRole, string[]> = {
    admin: ['/', '/leads', '/pricing', '/confirmed', '/operations', '/payables', '/collections', '/commissions', '/database'],
    sales: ['/leads', '/pricing'],
    finance: ['/payables', '/collections', '/commissions'],
    operations: ['/operations'],
  };
  
  return editPermissions[role]?.includes(page) || false;
}
