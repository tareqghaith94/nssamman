export type UserRole = 'admin' | 'sales' | 'pricing' | 'ops' | 'collections' | 'finance';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

// Page access permissions by role
export const PAGE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['/', '/leads', '/pricing', '/confirmed', '/operations', '/payables', '/collections', '/commissions', '/database'],
  sales: ['/', '/leads', '/pricing', '/confirmed', '/operations', '/payables', '/collections', '/database'], // No commissions
  pricing: ['/', '/leads', '/pricing', '/confirmed', '/database'],
  ops: ['/', '/operations', '/confirmed', '/database'],
  collections: ['/', '/collections', '/confirmed', '/database'],
  finance: ['/', '/payables', '/confirmed', '/database'],
};

// Fields that are ALWAYS read-only (global locks)
export const GLOBAL_READONLY_FIELDS = [
  'referenceId',
  'grossProfit',
  'profitPerUnit',
  'totalSellingPrice',
  'totalCost',
  'commissionRate',
  'commissionAmount',
];

// Fields hidden from specific roles
export const HIDDEN_FIELDS: Record<UserRole, string[]> = {
  admin: [],
  sales: ['commissionRate', 'commissionAmount', 'commissionLogic'],
  pricing: ['commissionRate', 'commissionAmount', 'commissionLogic'],
  ops: ['commissionRate', 'commissionAmount', 'commissionLogic'],
  collections: ['commissionRate', 'commissionAmount', 'commissionLogic'],
  finance: ['commissionRate', 'commissionAmount', 'commissionLogic'],
};

// Field categories for easier management
export const FIELD_CATEGORIES = {
  lead: ['salesperson', 'portOfLoading', 'portOfDischarge', 'equipment', 'modeOfTransport', 'incoterm', 'paymentTerms'],
  pricing: ['sellingPricePerUnit', 'costPerUnit', 'agent'],
  operations: ['nssBookingReference', 'nssInvoiceNumber', 'etd', 'eta', 'blDraftReceived', 'blDraftSent', 'blFinalReceived', 'blType', 'cargoReadyDate', 'vesselName', 'voyageNumber'],
  collections: ['collectionStatus', 'collectionFollowUp', 'collectedAmount', 'collectionDate'],
  payables: ['paymentStatus', 'agentInvoiceAmount', 'agentInvoiceUploaded', 'paymentFollowUp'],
  clientRemarks: ['clientRemarks'],
  commissions: ['commissionRate', 'commissionAmount'],
};

// Valid stage transitions
export const VALID_TRANSITIONS: Record<string, string[]> = {
  lead: ['pricing'],
  pricing: ['confirmed'],
  confirmed: ['operations'],
  operations: ['completed'],
  completed: [],
};
