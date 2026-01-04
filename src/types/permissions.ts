export type UserRole = 'admin' | 'sales' | 'finance' | 'operations';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

// Page access permissions by role
export const PAGE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['/', '/leads', '/pricing', '/confirmed', '/operations', '/payables', '/collections', '/commissions', '/database'],
  sales: ['/', '/leads', '/pricing', '/confirmed', '/operations', '/database'],
  finance: ['/', '/payables', '/collections', '/commissions', '/database'],
  operations: ['/', '/operations', '/database'],
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

// Valid stage transitions
export const VALID_TRANSITIONS: Record<string, string[]> = {
  lead: ['pricing'],
  pricing: ['confirmed'],
  confirmed: ['operations'],
  operations: ['completed'],
  completed: [],
};
