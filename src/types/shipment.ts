export type ShipmentStage = 'lead' | 'pricing' | 'confirmed' | 'operations' | 'completed';
export type PaymentTerms = 'prepaid' | 'collect' | '30days' | '60days' | '90days';
export type EquipmentType = '20ft' | '40ft' | '40hc' | '45ft' | 'lcl' | 'breakbulk';
export type ModeOfTransport = 'sea' | 'air' | 'land' | 'multimodal';
export type BLType = 'original' | 'telex' | 'seaway';

export interface Shipment {
  id: string;
  referenceId: string;
  salesperson: string;
  portOfLoading: string;
  portOfDischarge: string;
  equipmentType: EquipmentType;
  quantity: number;
  modeOfTransport: ModeOfTransport;
  paymentTerms: PaymentTerms;
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
  
  // Payment tracking
  paymentCollected?: boolean;
  paymentCollectedDate?: Date;
  agentPaid?: boolean;
  agentPaidDate?: Date;
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
