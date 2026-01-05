import { useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Notification } from '@/types/notification';

interface NotificationRow {
  id: string;
  user_id: string;
  shipment_id: string | null;
  reference_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

function rowToNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    shipmentId: row.shipment_id || undefined,
    referenceId: row.reference_id,
    type: row.type as Notification['type'],
    title: row.title,
    message: row.message,
    read: row.read,
    createdAt: new Date(row.created_at),
  };
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return (data as NotificationRow[]).map(rowToNotification);
    },
    enabled: !!user?.id,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const createNotification = useCallback(async (
    targetUserId: string,
    data: {
      shipmentId?: string;
      referenceId: string;
      type: Notification['type'];
      title: string;
      message: string;
    }
  ) => {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: targetUserId,
        shipment_id: data.shipmentId || null,
        reference_id: data.referenceId,
        type: data.type,
        title: data.title,
        message: data.message,
      });
    
    if (error) {
      console.error('Error creating notification:', error);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    createNotification,
  };
}
