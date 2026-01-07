import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface LeaveRequest {
  id: string;
  user_id: string;
  employee_name: string;
  leave_type: 'annual' | 'sick' | 'unpaid' | 'personal' | 'other';
  start_date: string;
  end_date: string;
  days_count: number;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  approved_by: string | null;
  created_at: string;
}

export interface LeaveBalance {
  annual: number;
  sick: number;
  unpaid: number;
  personal: number;
  other: number;
  pending: number;
}

export function useLeaveRequests() {
  const queryClient = useQueryClient();
  const { user, roles, profile } = useAuth();
  const isAdmin = roles?.includes('admin');

  const { data: leaveRequests = [], isLoading } = useQuery({
    queryKey: ['leave-requests', user?.id, isAdmin],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data as LeaveRequest[];
    },
    enabled: !!user,
  });

  // Calculate leave balance for current year
  const currentYear = new Date().getFullYear();
  const myRequests = leaveRequests.filter(r => r.user_id === user?.id);
  const approvedThisYear = myRequests.filter(
    r => r.status === 'approved' && new Date(r.start_date).getFullYear() === currentYear
  );

  const leaveBalance: LeaveBalance = {
    annual: approvedThisYear.filter(r => r.leave_type === 'annual').reduce((sum, r) => sum + r.days_count, 0),
    sick: approvedThisYear.filter(r => r.leave_type === 'sick').reduce((sum, r) => sum + r.days_count, 0),
    unpaid: approvedThisYear.filter(r => r.leave_type === 'unpaid').reduce((sum, r) => sum + r.days_count, 0),
    personal: approvedThisYear.filter(r => r.leave_type === 'personal').reduce((sum, r) => sum + r.days_count, 0),
    other: approvedThisYear.filter(r => r.leave_type === 'other').reduce((sum, r) => sum + r.days_count, 0),
    pending: myRequests.filter(r => r.status === 'pending').length,
  };

  const addLeaveRequest = useMutation({
    mutationFn: async (request: Omit<LeaveRequest, 'id' | 'created_at' | 'approved_by'>) => {
      const { data, error } = await supabase
        .from('leave_requests')
        .insert(request)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      toast.success('Leave request submitted');
    },
    onError: (error) => {
      toast.error('Failed to submit leave request: ' + error.message);
    },
  });

  const updateLeaveRequest = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LeaveRequest> & { id: string }) => {
      const { data, error } = await supabase
        .from('leave_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      toast.success('Leave request updated');
    },
    onError: (error) => {
      toast.error('Failed to update leave request: ' + error.message);
    },
  });

  const deleteLeaveRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leave_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      toast.success('Leave request deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete leave request: ' + error.message);
    },
  });

  const approveLeaveRequest = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('leave_requests')
        .update({ status: 'approved', approved_by: user?.id })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      toast.success('Leave request approved');
    },
    onError: (error) => {
      toast.error('Failed to approve leave request: ' + error.message);
    },
  });

  const rejectLeaveRequest = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('leave_requests')
        .update({ status: 'rejected', approved_by: user?.id })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      toast.success('Leave request rejected');
    },
    onError: (error) => {
      toast.error('Failed to reject leave request: ' + error.message);
    },
  });

  return {
    leaveRequests,
    myRequests,
    leaveBalance,
    isLoading,
    isAdmin,
    currentUser: { id: user?.id, name: profile?.name },
    addLeaveRequest,
    updateLeaveRequest,
    deleteLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest,
  };
}
