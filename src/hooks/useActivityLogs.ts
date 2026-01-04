import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ActivityLog, ActivityType } from '@/types/activity';

// Type for database row (snake_case)
interface ActivityLogRow {
  id: string;
  shipment_id: string | null;
  reference_id: string | null;
  type: string;
  description: string;
  user_id: string | null;
  user_name: string | null;
  user_role: string | null;
  timestamp: string;
  field: string | null;
  previous_value: string | null;
  new_value: string | null;
}

// Convert database row to frontend ActivityLog type
function rowToActivityLog(row: ActivityLogRow): ActivityLog {
  return {
    id: row.id,
    shipmentId: row.shipment_id ?? '',
    referenceId: row.reference_id ?? '',
    type: row.type as ActivityType,
    description: row.description,
    user: row.user_name ?? 'Unknown',
    userRole: row.user_role ?? 'Unknown',
    timestamp: new Date(row.timestamp),
    field: row.field ?? undefined,
    previousValue: row.previous_value ?? undefined,
    newValue: row.new_value ?? undefined,
  };
}

export function useActivityLogs(shipmentId?: string) {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  // Fetch activities
  const { data: activities = [], isLoading, error, refetch } = useQuery({
    queryKey: ['activity_logs', shipmentId],
    queryFn: async () => {
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (shipmentId) {
        query = query.eq('shipment_id', shipmentId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return (data as ActivityLogRow[]).map(rowToActivityLog);
    },
    enabled: !!user,
  });

  // Add activity mutation
  const addActivityMutation = useMutation({
    mutationFn: async (activityData: Omit<ActivityLog, 'id' | 'timestamp'>) => {
      const insertData = {
        shipment_id: activityData.shipmentId || null,
        reference_id: activityData.referenceId || null,
        type: activityData.type,
        description: activityData.description,
        user_id: user?.id || null,
        user_name: activityData.user || profile?.name || 'Unknown',
        user_role: activityData.userRole || profile?.role || 'Unknown',
        field: activityData.field || null,
        previous_value: activityData.previousValue || null,
        new_value: activityData.newValue || null,
      };
      
      const { data, error } = await supabase
        .from('activity_logs')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      return rowToActivityLog(data as ActivityLogRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity_logs'] });
    },
    onError: (error) => {
      console.error('Error adding activity log:', error);
    },
  });

  // Clear all activities mutation (admin only)
  const clearActivitiesMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('activity_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity_logs'] });
    },
    onError: (error) => {
      console.error('Error clearing activities:', error);
    },
  });

  // Helper functions
  const addActivity = (activityData: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    return addActivityMutation.mutateAsync(activityData);
  };

  const clearActivities = () => {
    return clearActivitiesMutation.mutateAsync();
  };

  const getActivitiesByShipment = (shipId: string) => {
    return activities.filter((a) => a.shipmentId === shipId);
  };

  return {
    activities,
    isLoading,
    error,
    refetch,
    addActivity,
    clearActivities,
    getActivitiesByShipment,
    isAdding: addActivityMutation.isPending,
  };
}
