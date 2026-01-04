import { useShipments } from '@/hooks/useShipments';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import { useAuth } from '@/hooks/useAuth';
import { Shipment, ShipmentStage } from '@/types/shipment';
import { ActivityType } from '@/types/activity';

export function useTrackedShipmentActions() {
  const { addShipment, updateShipment, moveToStage, shipments } = useShipments();
  const { addActivity } = useActivityLogs();
  const { profile } = useAuth();

  const logActivity = async (
    shipmentId: string,
    referenceId: string,
    type: ActivityType,
    description: string,
    previousValue?: string,
    newValue?: string,
    field?: string
  ) => {
    try {
      await addActivity({
        shipmentId,
        referenceId,
        type,
        description,
        user: profile?.name || 'Unknown',
        userRole: profile?.role || 'Unknown',
        previousValue,
        newValue,
        field,
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const createShipment = async (shipmentData: Omit<Shipment, 'id' | 'referenceId' | 'createdAt' | 'stage'>) => {
    try {
      const newShipment = await addShipment(shipmentData);
      
      if (newShipment) {
        await logActivity(
          newShipment.id,
          newShipment.referenceId,
          'created',
          `Created new lead for ${shipmentData.salesperson}: ${shipmentData.portOfLoading} → ${shipmentData.portOfDischarge}`
        );
      }
      
      return newShipment;
    } catch (error) {
      console.error('Error creating shipment:', error);
      throw error;
    }
  };

  const trackUpdateShipment = async (
    shipment: Shipment,
    updates: Partial<Shipment>,
    changedFields?: { field: string; oldValue: string; newValue: string }[]
  ) => {
    try {
      await updateShipment(shipment.id, updates);

      // Log specific field changes
      if (changedFields && changedFields.length > 0) {
        for (const { field, oldValue, newValue } of changedFields) {
          await logActivity(
            shipment.id,
            shipment.referenceId,
            'field_update',
            `Updated ${field}`,
            oldValue,
            newValue,
            field
          );
        }
      }

      // Check for special updates
      if (updates.isLost && !shipment.isLost) {
        await logActivity(
          shipment.id,
          shipment.referenceId,
          'marked_lost',
          `Marked as lost: ${updates.lostReason || 'No reason specified'}`
        );
      }

      if (updates.paymentCollected && !shipment.paymentCollected) {
        await logActivity(
          shipment.id,
          shipment.referenceId,
          'payment_collected',
          `Payment collected for $${shipment.totalInvoiceAmount?.toLocaleString() || 'N/A'}`
        );
      }

      if (updates.agentPaid && !shipment.agentPaid) {
        await logActivity(
          shipment.id,
          shipment.referenceId,
          'agent_paid',
          `Agent ${shipment.agent} paid $${shipment.agentInvoiceAmount?.toLocaleString() || shipment.totalCost?.toLocaleString() || 'N/A'}`
        );
      }

      if (updates.agentInvoiceUploaded && !shipment.agentInvoiceUploaded) {
        await logActivity(
          shipment.id,
          shipment.referenceId,
          'invoice_uploaded',
          `Agent invoice uploaded: ${updates.agentInvoiceFileName || 'Unknown file'}`
        );
      }
    } catch (error) {
      console.error('Error updating shipment:', error);
      throw error;
    }
  };

  const trackMoveToStage = async (shipment: Shipment, newStage: ShipmentStage) => {
    const previousStage = shipment.stage;
    
    try {
      await moveToStage(shipment.id, newStage);
      
      await logActivity(
        shipment.id,
        shipment.referenceId,
        'stage_change',
        `Moved from ${previousStage} to ${newStage}`,
        previousStage,
        newStage,
        'stage'
      );
    } catch (error) {
      console.error('Error moving shipment to stage:', error);
      throw error;
    }
  };

  return {
    createShipment,
    trackUpdateShipment,
    trackMoveToStage,
    logActivity,
    shipments,
    updateShipment,
    moveToStage,
  };
}
