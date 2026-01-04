import { EquipmentItem, ModeOfTransport } from './shipment';

export type QuotationStatus = 'draft' | 'issued' | 'accepted' | 'expired';

export interface QuoteLineItem {
  id: string;
  quotationId: string;
  description: string;
  equipmentType?: string;
  unitCost: number;
  quantity: number;
  amount: number;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  shipmentId?: string;
  clientName: string;
  clientAddress?: string;
  pol: string;
  pod: string;
  modeOfTransport: ModeOfTransport;
  equipment: EquipmentItem[];
  oceanFreightAmount?: number;
  exwAmount?: number;
  exwQty?: number;
  remarks?: string;
  status: QuotationStatus;
  validUntil?: Date;
  createdAt: Date;
  createdBy?: string;
  issuedAt?: Date;
  lineItems?: QuoteLineItem[];
}
