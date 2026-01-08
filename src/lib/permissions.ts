import { Shipment, ShipmentStage } from '@/types/shipment';
import { UserRole, PAGE_PERMISSIONS, GLOBAL_READONLY_FIELDS, HIDDEN_FIELDS, FIELD_CATEGORIES, VALID_TRANSITIONS, REVERSE_TRANSITIONS } from '@/types/permissions';
import { STAGE_ORDER_MAP } from '@/lib/stageOrder';

// Check if a user with given roles can access a specific page
export function canAccessPage(roles: UserRole[], path: string): boolean {
  return roles.some(role => PAGE_PERMISSIONS[role]?.includes(path));
}

// Legacy single-role version for backwards compatibility
export function canAccessPageSingle(role: UserRole, path: string): boolean {
  const allowedPaths = PAGE_PERMISSIONS[role];
  return allowedPaths.includes(path);
}

// Check if a field is hidden for any of the user's roles
// Field is hidden only if ALL roles have it hidden
export function isFieldHidden(roles: UserRole[], fieldName: string): boolean {
  if (roles.length === 0) return true;
  return roles.every(role => HIDDEN_FIELDS[role]?.includes(fieldName));
}

// Legacy single-role version
export function isFieldHiddenSingle(role: UserRole, fieldName: string): boolean {
  return HIDDEN_FIELDS[role]?.includes(fieldName) || false;
}

// Check if a field is globally read-only
export function isGloballyReadOnly(fieldName: string): boolean {
  return GLOBAL_READONLY_FIELDS.includes(fieldName);
}

// Check if user can see a shipment - all authenticated users can see all shipments
export function canSeeShipment(shipment: Shipment, roles: UserRole[], refPrefix?: string): boolean {
  // All authenticated users can see all shipments
  return roles.length > 0;
}

// Check if a shipment can be edited at all
export function canEditShipment(
  shipment: Shipment, 
  roles: UserRole[], 
  refPrefix?: string,
  userName?: string
): boolean {
  // Lost shipments are read-only
  if (shipment.isLost) return false;
  
  // Completed shipments are read-only (except admin)
  if (shipment.stage === 'completed') {
    return roles.includes('admin');
  }
  
  // Admin can always edit
  if (roles.includes('admin')) return true;
  
  // Check stage-based ownership
  switch (shipment.stage) {
    case 'lead':
      // Salesperson can edit their own leads
      if (roles.includes('sales') && shipment.salesperson === userName) return true;
      // Pricing/Ops users can view to claim
      if (roles.includes('pricing') || roles.includes('ops')) return true;
      return false;
      
    case 'pricing':
      // Only the assigned pricing owner can edit
      if (roles.includes('pricing')) {
        if (!shipment.pricingOwner) return true;
        return shipment.pricingOwner === userName;
      }
      return false;
      
    case 'operations':
      // Only the assigned ops owner can edit
      if (roles.includes('ops')) {
        if (!shipment.opsOwner) return true;
        return shipment.opsOwner === userName;
      }
      return false;
      
    default:
      return false;
  }
}

// Check if user can edit a shipment in operations stage based on ops owner assignment
export function canEditAsOpsOwner(
  shipment: Shipment, 
  roles: UserRole[], 
  userName?: string
): boolean {
  // Admin can always edit
  if (roles.includes('admin')) return true;
  
  // If not in operations stage, this check doesn't apply
  if (shipment.stage !== 'operations') return true;
  
  // If user has ops role, check if they are the assigned ops owner
  if (roles.includes('ops')) {
    // If no ops owner assigned yet, any ops user can edit
    if (!shipment.opsOwner) return true;
    
    // Check if current user is the assigned ops owner
    return shipment.opsOwner === userName;
  }
  
  // Other roles can't edit ops fields anyway, so return true
  // (field-level permissions will handle the rest)
  return true;
}

// Check if user can edit a shipment in pricing stage based on pricing owner assignment
export function canEditAsPricingOwner(
  shipment: Shipment, 
  roles: UserRole[], 
  userName?: string
): boolean {
  // Admin can always edit
  if (roles.includes('admin')) return true;
  
  // If not in pricing stage, this check doesn't apply
  if (shipment.stage !== 'pricing') return true;
  
  // If user has pricing role, check if they are the assigned pricing owner
  if (roles.includes('pricing')) {
    // If no pricing owner assigned yet, any pricing user can edit
    if (!shipment.pricingOwner) return true;
    
    // Check if current user is the assigned pricing owner
    return shipment.pricingOwner === userName;
  }
  
  // Other roles can't edit pricing fields anyway, so return true
  return true;
}

// Check if user can edit a lead based on salesperson assignment
export function canEditAsSalesperson(
  shipment: Shipment, 
  roles: UserRole[], 
  userName?: string
): boolean {
  // Admin can always edit
  if (roles.includes('admin')) return true;
  
  // If not in lead stage, this check doesn't apply
  if (shipment.stage !== 'lead') return true;
  
  // If user has sales role, check if they are the assigned salesperson
  if (roles.includes('sales')) {
    // Check if current user is the assigned salesperson
    return shipment.salesperson === userName;
  }
  
  // Other roles can't edit lead fields anyway, so return true
  return true;
}

// Check if user can edit Payables or Collections based on ownership
export function canEditPayablesCollections(
  shipment: Shipment,
  roles: UserRole[],
  userName?: string
): boolean {
  // Admin can always edit
  if (roles.includes('admin')) return true;
  
  // Finance role can always edit payables/collections
  if (roles.includes('finance')) return true;
  
  // Check if user is one of the three owners
  const isSalesperson = userName && shipment.salesperson === userName;
  const isPricingOwner = userName && shipment.pricingOwner === userName;
  const isOpsOwner = userName && shipment.opsOwner === userName;
  
  return isSalesperson || isPricingOwner || isOpsOwner;
}

// Check if a specific field can be edited based on roles and shipment stage
export function canEditField(
  shipment: Shipment,
  fieldName: string,
  roles: UserRole[],
  refPrefix?: string,
  userName?: string
): boolean {
  // Global readonly fields are never editable
  if (isGloballyReadOnly(fieldName)) return false;
  
  // Hidden fields cannot be edited
  if (isFieldHidden(roles, fieldName)) return false;
  
  // Lost or completed shipments are locked (except for admin)
  if (shipment.isLost || shipment.stage === 'completed') {
    return roles.includes('admin');
  }
  
  // Admin can edit everything
  if (roles.includes('admin')) return true;
  
  // For payables fields, check ownership-based permission
  if (FIELD_CATEGORIES.payables.includes(fieldName)) {
    return canEditPayablesCollections(shipment, roles, userName);
  }
  
  // For collections fields, check ownership-based permission
  if (FIELD_CATEGORIES.collections.includes(fieldName)) {
    return canEditPayablesCollections(shipment, roles, userName);
  }
  
  // For operations fields, check ops owner permission
  if (FIELD_CATEGORIES.operations.includes(fieldName)) {
    if (!canEditAsOpsOwner(shipment, roles, userName)) {
      return false;
    }
  }
  
  // For pricing fields, check pricing owner permission
  if (FIELD_CATEGORIES.pricing.includes(fieldName)) {
    if (!canEditAsPricingOwner(shipment, roles, userName)) {
      return false;
    }
  }
  
  // For lead fields, check salesperson permission
  if (FIELD_CATEGORIES.lead.includes(fieldName)) {
    if (!canEditAsSalesperson(shipment, roles, userName)) {
      return false;
    }
  }
  
  // Check each role - if ANY role can edit the field, return true
  for (const role of roles) {
    if (canRoleEditField(shipment, fieldName, role, userName)) {
      return true;
    }
  }
  
  return false;
}

// Helper: Check if a single role can edit a field
function canRoleEditField(
  shipment: Shipment,
  fieldName: string,
  role: UserRole,
  userName?: string
): boolean {
  // Sales: can only edit lead info and client remarks on their own shipments
  // Sales CANNOT edit pricing or operations fields
  if (role === 'sales') {
    // Sales cannot edit pricing fields
    if (FIELD_CATEGORIES.pricing.includes(fieldName)) return false;
    // Sales cannot edit operations fields
    if (FIELD_CATEGORIES.operations.includes(fieldName)) return false;
    
    // Check ownership by salesperson name match
    if (!userName || shipment.salesperson !== userName) return false;
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
  
  // Pricing: can edit pricing fields AND lead fields during pricing stage
  if (role === 'pricing') {
    if (shipment.stage === 'pricing') {
      // During pricing stage, can edit both pricing and lead fields
      if (FIELD_CATEGORIES.pricing.includes(fieldName)) return true;
      if (FIELD_CATEGORIES.lead.includes(fieldName)) return true;
      // Also allow editing client name and currency
      if (fieldName === 'clientName' || fieldName === 'currency') return true;
    }
    // Pricing can also set pricingOwner during lead stage
    if (fieldName === 'pricingOwner' && shipment.stage === 'lead') {
      return true;
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

// Check if user can advance from a specific stage (multi-role)
export function canAdvanceStage(roles: UserRole[], currentStage: ShipmentStage): boolean {
  // Admin can always advance any stage
  if (roles.includes('admin')) return true;
  
  // Check each role
  return roles.some(role => canRoleAdvanceStage(role, currentStage));
}

// Helper: Check if a single role can advance a stage
function canRoleAdvanceStage(role: UserRole, currentStage: ShipmentStage): boolean {
  switch (currentStage) {
    case 'lead':
      // Lead → Pricing: Sales can advance
      return role === 'sales';
    
    case 'pricing':
      // Pricing → Operations: Pricing team can advance
      return role === 'pricing';
    
    case 'operations':
      // Operations → Completed: Ops team can advance
      return role === 'ops';
    
    case 'completed':
      // No further advancement possible
      return false;
    
    default:
      return false;
  }
}

// Check if user can revert from a specific stage (multi-role)
export function canRevertStage(roles: UserRole[], currentStage: ShipmentStage): boolean {
  // Can't revert from lead - no previous stage
  if (currentStage === 'lead') return false;
  
  // Admin can always revert any stage
  if (roles.includes('admin')) return true;
  
  // Check each role
  return roles.some(role => canRoleRevertStage(role, currentStage));
}

// Helper: Check if a single role can revert a stage
function canRoleRevertStage(role: UserRole, currentStage: ShipmentStage): boolean {
  switch (currentStage) {
    case 'pricing':
      // Pricing → Lead: Pricing team can revert
      return role === 'pricing';
    
    case 'operations':
      // Operations → Pricing: Ops team can revert
      return role === 'ops';
    
    case 'completed':
      // Completed → Operations: Ops team can revert
      return role === 'ops';
    
    default:
      return false;
  }
}

// Get the previous stage for revert
export function getPreviousStage(currentStage: ShipmentStage): ShipmentStage | null {
  return (REVERSE_TRANSITIONS[currentStage] as ShipmentStage) || null;
}

// Get the reason why a field cannot be edited
export function getFieldLockReason(fieldName: string, roles: UserRole[], shipment: Shipment): string {
  if (isGloballyReadOnly(fieldName)) {
    return 'This field is automatically calculated';
  }
  
  if (isFieldHidden(roles, fieldName)) {
    return 'You do not have permission to view this field';
  }
  
  if (shipment.isLost) {
    return 'This shipment is marked as lost';
  }
  
  if (shipment.stage === 'completed') {
    return 'This shipment is completed';
  }
  
  // Check specific role restrictions
  const roleNames = roles.join(', ');
  
  if (roles.includes('sales') && !roles.includes('admin')) {
    if (FIELD_CATEGORIES.lead.includes(fieldName) && shipment.stage !== 'lead') {
      return 'Lead details are locked after the lead stage';
    }
  }
  
  if (roles.includes('pricing') && !FIELD_CATEGORIES.pricing.includes(fieldName)) {
    return 'Pricing role can only edit pricing fields';
  }
  
  if (roles.includes('ops') && !FIELD_CATEGORIES.operations.includes(fieldName)) {
    return 'Operations role can only edit operations fields';
  }
  
  if (roles.includes('collections') && !FIELD_CATEGORIES.collections.includes(fieldName)) {
    return 'Collections role can only edit collection fields';
  }
  
  if (roles.includes('finance') && !FIELD_CATEGORIES.payables.includes(fieldName)) {
    return 'Finance role can only edit payables fields';
  }
  
  return 'This field is locked';
}

// Check if user can edit based on roles and page - all authenticated users can edit for now
export function canEditOnPage(roles: UserRole[], page: string): boolean {
  // All authenticated users can edit on all pages for now
  if (roles.length > 0) return true;
  return false;
}
