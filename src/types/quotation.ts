import { EquipmentItem, ModeOfTransport, Currency } from './shipment';

export type QuotationStatus = 'draft' | 'issued' | 'accepted' | 'expired';

export interface QuoteLineItem {
  id: string;
  quotationId: string;
  description: string;
  equipmentType?: string;
  unitCost: number;
  quantity: number;
  amount: number;
  currency?: string;
}

export interface Quotation {
  id: string;
  referenceId: string; // From linked shipment
  shipmentId: string;
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
  currency?: Currency; // Currency for the quotation document (USD, EUR, JOD)
  lineItems?: Omit<QuoteLineItem, 'id' | 'quotationId' | 'amount'>[];
}
