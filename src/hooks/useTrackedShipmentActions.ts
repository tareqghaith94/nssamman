import { useShipments } from '@/hooks/useShipments';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import { useAuth } from '@/hooks/useAuth';
import { Shipment, ShipmentStage } from '@/types/shipment';
import { ActivityType } from '@/types/activity';
import { supabase } from '@/integrations/supabase/client';

export function useTrackedShipmentActions() {
  const { addShipment, updateShipment, moveToStage, shipments } = useShipments();
  const { addActivity } = useActivityLogs();
  const { profile, user } = useAuth();

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

  // Create notification for relevant users
  const createNotification = async (
    shipment: Shipment,
    type: 'stage_change' | 'assignment' | 'update' | 'payment' | 'quotation',
    title: string,
    message: string
  ) => {
    try {
      // Find the user who created this shipment to notify them
      // We get the creator's user_id from the shipment's created_by field
      const { data: shipmentData } = await supabase
        .from('shipments')
        .select('created_by')
        .eq('id', shipment.id)
        .single();

      if (shipmentData?.created_by && shipmentData.created_by !== user?.id) {
        // Notify the shipment creator (if not the current user)
        await supabase
          .from('notifications')
          .insert({
            user_id: shipmentData.created_by,
            shipment_id: shipment.id,
            reference_id: shipment.referenceId,
            type,
            title,
            message,
          });
      }
    } catch (error) {
      console.error('Error creating notification:', error);
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

      // Notify the shipment creator about stage change
      await createNotification(
        shipment,
        'stage_change',
        `${shipment.referenceId} moved to ${newStage}`,
        `${profile?.name || 'Someone'} moved your shipment from ${previousStage} to ${newStage}`
      );
    } catch (error) {
      console.error('Error moving shipment to stage:', error);
      throw error;
    }
  };

  const trackRevertStage = async (shipment: Shipment, previousStage: ShipmentStage) => {
    const currentStage = shipment.stage;
    
    try {
      // If reverting from completed, clear the completedAt field alongside the stage change
      const updates: Partial<Shipment> = {};
      if (currentStage === 'completed') {
        updates.completedAt = undefined; // Will be converted to null in shipmentToRow
      }
      
      await moveToStage(shipment.id, previousStage);
      
      await logActivity(
        shipment.id,
        shipment.referenceId,
        'stage_revert',
        `Reverted from ${currentStage} to ${previousStage}`,
        currentStage,
        previousStage,
        'stage'
      );
    } catch (error) {
      console.error('Error reverting shipment stage:', error);
      throw error;
    }
  };

  return {
    createShipment,
    trackUpdateShipment,
    trackMoveToStage,
    trackRevertStage,
    logActivity,
    shipments,
    updateShipment,
    moveToStage,
  };
}
