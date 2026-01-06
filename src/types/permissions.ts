export type UserRole = 'admin' | 'sales' | 'pricing' | 'ops' | 'collections' | 'finance';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  refPrefix?: string; // Reference ID prefix for sales users (e.g., "A" for Amjad)
}

// Salesperson reference prefixes - maps salesperson name to their ref prefix
export const SALESPERSON_REF_PREFIX: Record<string, string> = {
  'Amjad': 'A',
  'Tareq': 'T',
  'Mozayan': 'M',
  'Rania': 'R',
  'Sanad': 'S',
  'Uma': 'U',
  'Marwan': 'MA',
};

// Page access permissions by role (removed /confirmed)
export const PAGE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['/', '/leads', '/pricing', '/quotations', '/operations', '/payables', '/collections', '/commissions', '/database', '/activity-log', '/users'],
  sales: ['/', '/leads', '/pricing', '/quotations', '/operations', '/collections', '/commissions'],
  pricing: ['/', '/leads', '/pricing', '/quotations'],
  ops: ['/', '/operations'],
  collections: ['/', '/collections'],
  finance: ['/', '/payables'],
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

// Field categories for easier management - must match Shipment type fields
export const FIELD_CATEGORIES = {
  lead: ['salesperson', 'portOfLoading', 'portOfDischarge', 'equipment', 'modeOfTransport', 'incoterm', 'paymentTerms'],
  pricing: ['sellingPricePerUnit', 'costPerUnit', 'agent', 'pricingOwner'],
  operations: [
    'nssBookingReference', 
    'nssInvoiceNumber', 
    'blType',
    'blDraftApproval',
    'finalBLIssued',
    'terminalCutoff',
    'gateInTerminal',
    'etd', 
    'eta',
    'arrivalNoticeSent',
    'doIssued',
    'doReleaseDate',
    'totalInvoiceAmount',
    'opsOwner'
  ],
  collections: ['paymentCollected', 'paymentCollectedDate'],
  payables: ['agentPaid', 'agentPaidDate', 'agentInvoiceUploaded', 'agentInvoiceFileName', 'agentInvoiceAmount', 'agentInvoiceDate'],
  clientRemarks: ['clientRemarks'],
  commissions: ['commissionRate', 'commissionAmount'],
};

// Valid stage transitions (removed confirmed stage)
export const VALID_TRANSITIONS: Record<string, string[]> = {
  lead: ['pricing'],
  pricing: ['operations', 'lead'],           // Pricing now goes directly to operations
  operations: ['completed', 'pricing'],      // Reverts to pricing (skipping confirmed)
  completed: ['operations'],                 // Can go back to operations
};

// Reverse transitions for undo functionality (removed confirmed)
export const REVERSE_TRANSITIONS: Record<string, string> = {
  pricing: 'lead',
  operations: 'pricing',                     // Now reverts to pricing directly
  completed: 'operations',
};
