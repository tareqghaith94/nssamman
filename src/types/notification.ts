export type NotificationType = 
  | 'stage_change' 
  | 'assignment' 
  | 'update' 
  | 'payment' 
  | 'quotation'
  | 'admin_edit'
  | 'payables_update'
  | 'collections_update';

export interface Notification {
  id: string;
  userId: string;
  shipmentId?: string;
  referenceId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}
