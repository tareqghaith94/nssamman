export interface Notification {
  id: string;
  userId: string;
  shipmentId?: string;
  referenceId: string;
  type: 'stage_change' | 'assignment' | 'update' | 'payment' | 'quotation';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}
