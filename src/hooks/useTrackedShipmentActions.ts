import { useShipmentStore } from '@/store/shipmentStore';
import { useActivityStore } from '@/store/activityStore';
import { useUserStore } from '@/store/userStore';
import { Shipment, ShipmentStage } from '@/types/shipment';
import { ActivityType } from '@/types/activity';

export function useTrackedShipmentActions() {
  const { addShipment, updateShipment, moveToStage, shipments } = useShipmentStore();
  const { addActivity } = useActivityStore();
  const currentUser = useUserStore((s) => s.currentUser);

  const logActivity = (
    shipmentId: string,
    referenceId: string,
    type: ActivityType,
    description: string,
    previousValue?: string,
    newValue?: string,
    field?: string
  ) => {
    addActivity({
      shipmentId,
      referenceId,
      type,
      description,
      user: currentUser.name,
      userRole: currentUser.role,
      previousValue,
      newValue,
      field,
    });
  };

  const createShipment = (shipmentData: Omit<Shipment, 'id' | 'referenceId' | 'createdAt' | 'stage'>) => {
    // We need to calculate what the reference ID will be
    const existingCount = shipments.filter(s => s.salesperson === shipmentData.salesperson).length + 1;
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    
    addShipment(shipmentData);
    
    // Get the newly added shipment
    const newShipments = useShipmentStore.getState().shipments;
    const newShipment = newShipments[newShipments.length - 1];
    
    if (newShipment) {
      logActivity(
        newShipment.id,
        newShipment.referenceId,
        'created',
        `Created new lead for ${shipmentData.salesperson}: ${shipmentData.portOfLoading} → ${shipmentData.portOfDischarge}`
      );
    }
  };

  const trackUpdateShipment = (
    shipment: Shipment,
    updates: Partial<Shipment>,
    changedFields?: { field: string; oldValue: string; newValue: string }[]
  ) => {
    updateShipment(shipment.id, updates);

    // Log specific field changes
    if (changedFields && changedFields.length > 0) {
      changedFields.forEach(({ field, oldValue, newValue }) => {
        logActivity(
          shipment.id,
          shipment.referenceId,
          'field_update',
          `Updated ${field}`,
          oldValue,
          newValue,
          field
        );
      });
    }

    // Check for special updates
    if (updates.isLost && !shipment.isLost) {
      logActivity(
        shipment.id,
        shipment.referenceId,
        'marked_lost',
        `Marked as lost: ${updates.lostReason || 'No reason specified'}`
      );
    }

    if (updates.paymentCollected && !shipment.paymentCollected) {
      logActivity(
        shipment.id,
        shipment.referenceId,
        'payment_collected',
        `Payment collected for $${shipment.totalInvoiceAmount?.toLocaleString() || 'N/A'}`
      );
    }

    if (updates.agentPaid && !shipment.agentPaid) {
      logActivity(
        shipment.id,
        shipment.referenceId,
        'agent_paid',
        `Agent ${shipment.agent} paid $${shipment.agentInvoiceAmount?.toLocaleString() || shipment.totalCost?.toLocaleString() || 'N/A'}`
      );
    }

    if (updates.agentInvoiceUploaded && !shipment.agentInvoiceUploaded) {
      logActivity(
        shipment.id,
        shipment.referenceId,
        'invoice_uploaded',
        `Agent invoice uploaded: ${updates.agentInvoiceFileName || 'Unknown file'}`
      );
    }
  };

  const trackMoveToStage = (shipment: Shipment, newStage: ShipmentStage) => {
    const previousStage = shipment.stage;
    moveToStage(shipment.id, newStage);
    
    logActivity(
      shipment.id,
      shipment.referenceId,
      'stage_change',
      `Moved from ${previousStage} to ${newStage}`,
      previousStage,
      newStage,
      'stage'
    );
  };

  return {
    createShipment,
    trackUpdateShipment,
    trackMoveToStage,
    logActivity,
  };
}
