import { useShipments } from '@/hooks/useShipments';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import { useAuth } from '@/hooks/useAuth';
import { Shipment, ShipmentStage } from '@/types/shipment';
import { ActivityType } from '@/types/activity';
import { NotificationType } from '@/types/notification';
import { FIELD_CATEGORIES } from '@/types/permissions';
import { supabase } from '@/integrations/supabase/client';

// Helper to find user ID by name from profiles
async function findUserIdByName(name: string): Promise<string | null> {
  if (!name) return null;
  const { data } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('name', name)
    .single();
  return data?.user_id || null;
}

// Helper to find all admin user IDs
async function findAdminUserIds(): Promise<string[]> {
  const { data } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin');
  return data?.map(r => r.user_id) || [];
}

export function useTrackedShipmentActions() {
  const { addShipment, updateShipment, moveToStage, shipments } = useShipments();
  const { addActivity } = useActivityLogs();
  const { profile, user, roles } = useAuth();

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

  // Create notification for a specific user
  const createNotificationForUser = async (
    userId: string,
    shipment: Shipment,
    type: NotificationType,
    title: string,
    message: string
  ) => {
    try {
      // Don't notify the current user about their own actions
      if (userId === user?.id) return;
      
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          shipment_id: shipment.id,
          reference_id: shipment.referenceId,
          type,
          title,
          message,
        });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  // Notify shipment owners (salesperson, pricing owner, ops owner)
  const notifyShipmentOwners = async (
    shipment: Shipment,
    type: NotificationType,
    title: string,
    message: string,
    includeAdmins: boolean = false
  ) => {
    const userIds: string[] = [];
    
    // Get salesperson's user ID
    if (shipment.salesperson) {
      const userId = await findUserIdByName(shipment.salesperson);
      if (userId) userIds.push(userId);
    }
    
    // Get pricing owner's user ID
    if (shipment.pricingOwner) {
      const userId = await findUserIdByName(shipment.pricingOwner);
      if (userId) userIds.push(userId);
    }
    
    // Get ops owner's user ID
    if (shipment.opsOwner) {
      const userId = await findUserIdByName(shipment.opsOwner);
      if (userId) userIds.push(userId);
    }
    
    // Include all admins if requested
    if (includeAdmins) {
      const adminIds = await findAdminUserIds();
      userIds.push(...adminIds);
    }
    
    // Remove duplicates and current user
    const uniqueUserIds = [...new Set(userIds)].filter(id => id !== user?.id);
    
    // Create notifications for all unique users
    for (const userId of uniqueUserIds) {
      await createNotificationForUser(userId, shipment, type, title, message);
    }
  };

  // Notify specific stage owner when admin makes edits
  const notifyStageOwnerOnAdminEdit = async (
    shipment: Shipment,
    fieldCategory: string,
    fieldName: string
  ) => {
    const isAdmin = roles?.includes('admin');
    if (!isAdmin) return;

    let ownerName: string | null = null;
    let stageName: string = '';

    if (fieldCategory === 'lead') {
      ownerName = shipment.salesperson;
      stageName = 'Lead';
    } else if (fieldCategory === 'pricing') {
      ownerName = shipment.pricingOwner;
      stageName = 'Pricing';
    } else if (fieldCategory === 'operations') {
      ownerName = shipment.opsOwner;
      stageName = 'Operations';
    } else if (fieldCategory === 'payables' || fieldCategory === 'collections') {
      // For payables/collections, notify all three owners
      await notifyShipmentOwners(
        shipment,
        'admin_edit',
        `Admin edited ${shipment.referenceId}`,
        `${profile?.name || 'Admin'} updated ${fieldName} in ${fieldCategory}`
      );
      return;
    }

    if (ownerName) {
      const ownerId = await findUserIdByName(ownerName);
      if (ownerId) {
        await createNotificationForUser(
          ownerId,
          shipment,
          'admin_edit',
          `Admin edited ${shipment.referenceId}`,
          `${profile?.name || 'Admin'} updated ${fieldName} in ${stageName}`
        );
      }
    }
  };

  // Create notification for relevant users (legacy - for stage changes)
  const createNotification = async (
    shipment: Shipment,
    type: NotificationType,
    title: string,
    message: string
  ) => {
    try {
      // Find the user who created this shipment to notify them
      const { data: shipmentData } = await supabase
        .from('shipments')
        .select('created_by')
        .eq('id', shipment.id)
        .single();

      if (shipmentData?.created_by && shipmentData.created_by !== user?.id) {
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

  // Determine which category a field belongs to
  const getFieldCategory = (fieldName: string): string | null => {
    for (const [category, fields] of Object.entries(FIELD_CATEGORIES)) {
      if (fields.includes(fieldName)) {
        return category;
      }
    }
    return null;
  };

  const trackUpdateShipment = async (
    shipment: Shipment,
    updates: Partial<Shipment>,
    changedFields?: { field: string; oldValue: string; newValue: string }[]
  ) => {
    try {
      await updateShipment(shipment.id, updates);

      // Track which categories were updated for notifications
      const payablesUpdated = changedFields?.some(f => FIELD_CATEGORIES.payables.includes(f.field));
      const collectionsUpdated = changedFields?.some(f => FIELD_CATEGORIES.collections.includes(f.field));
      const isAdmin = roles?.includes('admin');

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

          // If admin made the edit, notify the stage owner
          if (isAdmin) {
            const category = getFieldCategory(field);
            if (category) {
              await notifyStageOwnerOnAdminEdit(shipment, category, field);
            }
          }
        }
      }

      // Notify all owners + admins for payables changes
      if (payablesUpdated) {
        await notifyShipmentOwners(
          shipment,
          'payables_update',
          `Payables updated for ${shipment.referenceId}`,
          `${profile?.name || 'Someone'} updated payables information`,
          true // include admins
        );
      }

      // Notify all owners + admins for collections changes
      if (collectionsUpdated) {
        await notifyShipmentOwners(
          shipment,
          'collections_update',
          `Collections updated for ${shipment.referenceId}`,
          `${profile?.name || 'Someone'} updated collections information`,
          true // include admins
        );
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