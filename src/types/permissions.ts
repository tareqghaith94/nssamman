export type UserRole = 'admin' | 'sales' | 'finance' | 'operations';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

// Page access permissions by role
export const PAGE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['/', '/leads', '/pricing', '/confirmed', '/operations', '/payables', '/collections', '/commissions'],
  sales: ['/', '/leads', '/pricing', '/confirmed', '/operations'],
  finance: ['/', '/payables', '/collections', '/commissions'],
  operations: ['/', '/operations'],
};

// Fields that become locked after certain stages
export const FIELD_LOCK_RULES: Record<string, string> = {
  salesperson: 'confirmed',
  portOfLoading: 'confirmed',
  portOfDischarge: 'confirmed',
  equipment: 'confirmed',
  paymentTerms: 'confirmed',
  incoterm: 'confirmed',
  modeOfTransport: 'confirmed',
  agent: 'operations',
  sellingPricePerUnit: 'operations',
  costPerUnit: 'operations',
  nssBookingReference: 'completed',
  blType: 'completed',
};

// Stage order for comparison
export const STAGE_ORDER: Record<string, number> = {
  lead: 0,
  pricing: 1,
  confirmed: 2,
  operations: 3,
  completed: 4,
};

// Valid stage transitions
export const VALID_TRANSITIONS: Record<string, string[]> = {
  lead: ['pricing'],
  pricing: ['confirmed'],
  confirmed: ['operations'],
  operations: ['completed'],
  completed: [],
};
