export type ActivityType = 
  | 'created' 
  | 'stage_change' 
  | 'field_update' 
  | 'marked_lost'
  | 'payment_collected'
  | 'agent_paid'
  | 'invoice_uploaded';

export interface ActivityLog {
  id: string;
  shipmentId: string;
  referenceId: string;
  type: ActivityType;
  description: string;
  user: string;
  userRole: string;
  timestamp: Date;
  previousValue?: string;
  newValue?: string;
  field?: string;
}
