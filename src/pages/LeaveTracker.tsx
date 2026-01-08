import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LeaveRequestDialog } from '@/components/leave/LeaveRequestDialog';
import { useLeaveRequests, LeaveRequest } from '@/hooks/useLeaveRequests';
import { Plus, Calendar, Clock, Check, X, Trash2, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: 'Annual',
  sick: 'Sick',
  unpaid: 'Unpaid',
  personal: 'Personal',
  other: 'Other',
};

export default function LeaveTracker() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');

  const {
    leaveRequests,
    myRequests,
    leaveBalance,
    isLoading,
    isAdmin,
    currentUser,
    addLeaveRequest,
    updateLeaveRequest,
    deleteLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest,
  } = useLeaveRequests();

  // Fetch all employees for admin dropdown
  const { data: employees = [] } = useQuery({
    queryKey: ['profiles-for-leave'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name')
        .order('name');
      if (error) throw error;
      return data.map(p => ({ id: p.user_id, name: p.name }));
    },
    enabled: isAdmin,
  });

  // Filter requests based on role and filters
  const displayRequests = isAdmin ? leaveRequests : myRequests;
  const filteredRequests = displayRequests.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (isAdmin && employeeFilter !== 'all' && r.user_id !== employeeFilter) return false;
    return true;
  });

  const handleSubmit = (request: Omit<LeaveRequest, 'id' | 'created_at' | 'approved_by'>) => {
    if (editingRequest) {
      updateLeaveRequest.mutate({ id: editingRequest.id, ...request });
    } else {
      addLeaveRequest.mutate(request);
    }
    setEditingRequest(null);
  };

  const handleEdit = (request: LeaveRequest) => {
    setEditingRequest(request);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this leave request?')) {
      deleteLeaveRequest.mutate(id);
    }
  };

  const canEditRequest = (request: LeaveRequest) => {
    return (isAdmin || request.user_id === currentUser.id) && request.status === 'pending';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAdmin ? 'Leave Tracker' : 'My Leave'}
        description={isAdmin ? 'Manage employee time off' : 'Track your time off and leave balance'}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Annual Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{leaveBalance.annualRemaining} days</div>
            <p className="text-xs text-muted-foreground mt-1">
              {leaveBalance.annualUsed} used of {leaveBalance.annualEntitlement}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sick Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{leaveBalance.sickRemaining} days</div>
            <p className="text-xs text-muted-foreground mt-1">
              {leaveBalance.sickUsed} used of {leaveBalance.sickEntitlement}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Other Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveBalance.otherUsed} days</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unpaid / Personal
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              {leaveBalance.pending}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          {isAdmin && employees.length > 0 && (
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => { setEditingRequest(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Request Leave
        </Button>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {isAdmin && <TableHead>Employee</TableHead>}
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No leave requests found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    {isAdmin && <TableCell className="font-medium">{request.employee_name}</TableCell>}
                    <TableCell>{LEAVE_TYPE_LABELS[request.leave_type]}</TableCell>
                    <TableCell>
                      {format(new Date(request.start_date), 'MMM d')}
                      {request.start_date !== request.end_date && (
                        <> - {format(new Date(request.end_date), 'MMM d')}</>
                      )}
                    </TableCell>
                    <TableCell>{request.days_count}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[request.status]} variant="secondary">
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {request.notes || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {isAdmin && request.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => approveLeaveRequest.mutate(request.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => rejectLeaveRequest.mutate(request.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {canEditRequest(request) && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEdit(request)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(request.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Leave Request Dialog */}
      <LeaveRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        currentUser={currentUser}
        isAdmin={isAdmin}
        employees={employees}
        editingRequest={editingRequest}
      />
    </div>
  );
}
