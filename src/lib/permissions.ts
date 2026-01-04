import { Shipment, ShipmentStage } from '@/types/shipment';
import { UserRole, PAGE_PERMISSIONS, GLOBAL_READONLY_FIELDS, HIDDEN_FIELDS, FIELD_CATEGORIES, VALID_TRANSITIONS } from '@/types/permissions';
import { STAGE_ORDER_MAP } from '@/lib/stageOrder';

// Check if a user role can access a specific page
export function canAccessPage(role: UserRole, path: string): boolean {
  const allowedPaths = PAGE_PERMISSIONS[role];
  return allowedPaths.includes(path);
}

// Check if a field is hidden for a specific role
export function isFieldHidden(role: UserRole, fieldName: string): boolean {
  return HIDDEN_FIELDS[role]?.includes(fieldName) || false;
}

// Check if a field is globally read-only
export function isGloballyReadOnly(fieldName: string): boolean {
  return GLOBAL_READONLY_FIELDS.includes(fieldName);
}

// Check if user can see a shipment (sales can only see their own by ref prefix)
export function canSeeShipment(shipment: Shipment, role: UserRole, refPrefix?: string): boolean {
  if (role === 'admin') return true;
  if (role === 'sales') {
    // Match by reference ID prefix (e.g., "A-2601-0001" starts with "A-")
    if (!refPrefix) return false;
    return shipment.referenceId.startsWith(`${refPrefix}-`);
  }
  return true;
}

// Check if a shipment can be edited at all
export function canEditShipment(shipment: Shipment, role: UserRole, refPrefix?: string): boolean {
  // Lost shipments are read-only
  if (shipment.isLost) return false;
  
  // Admin can edit everything
  if (role === 'admin') return true;
  
  // Sales can only edit their own shipments (by ref prefix)
  if (role === 'sales') {
    if (!refPrefix) return false;
    return shipment.referenceId.startsWith(`${refPrefix}-`);
  }
  
  return true;
}

// Check if a specific field can be edited based on role and shipment stage
export function canEditField(
  shipment: Shipment,
  fieldName: string,
  role: UserRole,
  refPrefix?: string
): boolean {
  // Global readonly fields are never editable
  if (isGloballyReadOnly(fieldName)) return false;
  
  // Hidden fields cannot be edited
  if (isFieldHidden(role, fieldName)) return false;
  
  // Lost or completed shipments are locked (except for admin)
  if (shipment.isLost || shipment.stage === 'completed') {
    return role === 'admin';
  }
  
  // Admin can edit everything
  if (role === 'admin') return true;
  
  // Sales: can only edit lead info and client remarks on their own shipments
  if (role === 'sales') {
    // Check ownership by ref prefix
    if (!refPrefix || !shipment.referenceId.startsWith(`${refPrefix}-`)) return false;
    // Can only edit during lead stage for lead fields
    if (FIELD_CATEGORIES.lead.includes(fieldName)) {
      return shipment.stage === 'lead';
    }
    // Can edit client remarks at any stage
    if (FIELD_CATEGORIES.clientRemarks.includes(fieldName)) {
      return true;
    }
    return false;
  }
  
  // Pricing: can only edit pricing fields during pricing stage
  if (role === 'pricing') {
    if (FIELD_CATEGORIES.pricing.includes(fieldName)) {
      return shipment.stage === 'pricing';
    }
    return false;
  }
  
  // Ops: can only edit operations fields during operations stage
  if (role === 'ops') {
    if (FIELD_CATEGORIES.operations.includes(fieldName)) {
      return shipment.stage === 'operations';
    }
    return false;
  }
  
  // Collections: can only edit collections fields (not invoice amount or shipment data)
  if (role === 'collections') {
    if (FIELD_CATEGORIES.collections.includes(fieldName)) {
      return true;
    }
    return false;
  }
  
  // Finance: can only edit payables fields
  if (role === 'finance') {
    if (FIELD_CATEGORIES.payables.includes(fieldName)) {
      return true;
    }
    return false;
  }
  
  return false;
}

// Check if a stage transition is valid
export function canMoveToStage(shipment: Shipment, targetStage: ShipmentStage): boolean {
  const validTargets = VALID_TRANSITIONS[shipment.stage];
  return validTargets.includes(targetStage);
}

// Check if user can advance shipment stage
export function canAdvanceStage(role: UserRole): boolean {
  // Only admin can advance stages - no auto-advance buttons for other roles
  return role === 'admin';
}

// Get the reason why a field cannot be edited
export function getFieldLockReason(fieldName: string, role: UserRole, shipment: Shipment): string {
  if (isGloballyReadOnly(fieldName)) {
    return 'This field is automatically calculated';
  }
  
  if (isFieldHidden(role, fieldName)) {
    return 'You do not have permission to view this field';
  }
  
  if (shipment.isLost) {
    return 'This shipment is marked as lost';
  }
  
  if (shipment.stage === 'completed') {
    return 'This shipment is completed';
  }
  
  if (role === 'sales') {
    if (FIELD_CATEGORIES.lead.includes(fieldName) && shipment.stage !== 'lead') {
      return 'Lead details are locked after the lead stage';
    }
    return 'Sales cannot edit this field';
  }
  
  if (role === 'pricing' && !FIELD_CATEGORIES.pricing.includes(fieldName)) {
    return 'Pricing role can only edit pricing fields';
  }
  
  if (role === 'ops' && !FIELD_CATEGORIES.operations.includes(fieldName)) {
    return 'Operations role can only edit operations fields';
  }
  
  if (role === 'collections' && !FIELD_CATEGORIES.collections.includes(fieldName)) {
    return 'Collections role can only edit collection fields';
  }
  
  if (role === 'finance' && !FIELD_CATEGORIES.payables.includes(fieldName)) {
    return 'Finance role can only edit payables fields';
  }
  
  return 'This field is locked';
}

// Check if user can edit based on role and page (legacy compatibility)
export function canEditOnPage(role: UserRole, page: string): boolean {
  if (role === 'admin') return true;
  
  const editPermissions: Record<UserRole, string[]> = {
    admin: ['/', '/leads', '/pricing', '/confirmed', '/operations', '/payables', '/collections', '/commissions', '/database'],
    sales: ['/leads'], // Can only edit on leads page
    pricing: ['/pricing'],
    ops: ['/operations'],
    collections: ['/collections'],
    finance: ['/payables'],
  };
  
  return editPermissions[role]?.includes(page) || false;
}
