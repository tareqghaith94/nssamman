export type PartyType = 'agent' | 'shipping_line' | 'land_transport' | 'customs_broker' | 'other';

export interface ShipmentPayable {
  id: string;
  shipmentId: string;
  partyType: PartyType;
  partyName: string;
  estimatedAmount: number | null;
  invoiceAmount: number | null;
  invoiceFileName: string | null;
  invoiceFilePath: string | null;
  invoiceUploaded: boolean;
  invoiceDate: string | null;
  paid: boolean;
  paidDate: string | null;
  currency: string;
  notes: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayableWithShipment extends ShipmentPayable {
  referenceId: string;
  portOfLoading: string;
  portOfDischarge: string;
  etd: string | null;
  eta: string | null;
  clientName: string | null;
}

export interface ShipmentWithPayables {
  id: string;
  referenceId: string;
  clientName: string | null;
  portOfLoading: string;
  portOfDischarge: string;
  etd: string | null;
  eta: string | null;
  salesperson: string;
  pricingOwner: string | null;
  opsOwner: string | null;
  payables: ShipmentPayable[];
  totalOutstanding: number;
  paidCount: number;
  pendingCount: number;
}

export const PARTY_TYPE_LABELS: Record<PartyType, string> = {
  agent: 'Agent',
  shipping_line: 'Shipping Line',
  land_transport: 'Land Transport',
  customs_broker: 'Customs Broker',
  other: 'Other',
};

export const PARTY_TYPE_ICONS: Record<PartyType, string> = {
  agent: '🚢',
  shipping_line: '⚓',
  land_transport: '🚛',
  customs_broker: '📋',
  other: '📦',
};
