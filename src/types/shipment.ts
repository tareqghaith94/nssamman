export type ShipmentStage = 'lead' | 'pricing' | 'confirmed' | 'operations' | 'completed';
export type PaymentTerms = '0' | '30' | '60' | '90';
export type EquipmentType = '20ft' | '40ft' | '40hc' | '45ft' | 'lcl' | 'breakbulk' | 'airfreight';
export type ModeOfTransport = 'sea' | 'air' | 'land' | 'multimodal';
export type Incoterm = 'EXW' | 'FCA' | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP' | 'FAS' | 'FOB' | 'CFR' | 'CIF';
export type LostReason = 'price' | 'competitor' | 'cancelled' | 'timing' | 'requirements' | 'no_response' | 'other';

export interface EquipmentItem {
  type: EquipmentType;
  quantity: number;
}
export type BLType = 'original' | 'telex' | 'seaway';

export interface Shipment {
  id: string;
  referenceId: string;
  salesperson: string;
  portOfLoading: string;
  portOfDischarge: string;
  equipment: EquipmentItem[];
  modeOfTransport: ModeOfTransport;
  paymentTerms: PaymentTerms;
  incoterm: Incoterm;
  stage: ShipmentStage;
  createdAt: Date;
  
  // Pricing stage fields
  agent?: string;
  sellingPricePerUnit?: number;
  costPerUnit?: number;
  profitPerUnit?: number;
  totalSellingPrice?: number;
  totalCost?: number;
  totalProfit?: number;
  
  // Operations stage fields
  nssBookingReference?: string;
  nssInvoiceNumber?: string;
  blType?: BLType;
  blDraftApproval?: boolean;
  finalBLIssued?: boolean;
  terminalCutoff?: Date;
  gateInTerminal?: Date;
  etd?: Date;
  eta?: Date;
  arrivalNoticeSent?: boolean;
  doIssued?: boolean;
  doReleaseDate?: Date;
  totalInvoiceAmount?: number;
  completedAt?: Date;
  opsOwner?: 'Uma' | 'Rania' | 'Mozayan';
  
  // Payment tracking
  paymentCollected?: boolean;
  paymentCollectedDate?: Date;
  agentPaid?: boolean;
  agentPaidDate?: Date;
  
  // Agent invoice tracking
  agentInvoiceUploaded?: boolean;
  agentInvoiceFileName?: string;
  agentInvoiceAmount?: number;
  agentInvoiceDate?: Date;
  
  // Lost shipment tracking
  isLost?: boolean;
  lostReason?: LostReason;
  lostAt?: Date;
}

export interface Payable {
  shipmentId: string;
  referenceId: string;
  agent: string;
  amount: number;
  reminderDate: Date;
  paid: boolean;
  paidDate?: Date;
}

export interface Collection {
  shipmentId: string;
  referenceId: string;
  client: string;
  amount: number;
  dueDate: Date;
  collected: boolean;
  collectedDate?: Date;
}

export interface Commission {
  salesperson: string;
  shipmentId: string;
  referenceId: string;
  grossProfit: number;
  commissionAmount: number;
  collectedDate: Date;
}
