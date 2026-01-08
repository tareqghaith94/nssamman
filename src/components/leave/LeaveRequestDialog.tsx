import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { LeaveRequest } from '@/hooks/useLeaveRequests';
import { calculateBusinessDays } from '@/lib/leaveEntitlements';

interface LeaveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (request: Omit<LeaveRequest, 'id' | 'created_at' | 'approved_by'>) => void;
  currentUser: { id?: string; name?: string };
  isAdmin?: boolean;
  employees?: { id: string; name: string }[];
  editingRequest?: LeaveRequest | null;
}

const LEAVE_TYPES = [
  { value: 'annual', label: 'Annual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'unpaid', label: 'Unpaid Leave' },
  { value: 'personal', label: 'Personal Leave' },
  { value: 'other', label: 'Other' },
];

export function LeaveRequestDialog({
  open,
  onOpenChange,
  onSubmit,
  currentUser,
  isAdmin,
  employees = [],
  editingRequest,
}: LeaveRequestDialogProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; name: string } | null>(null);
  const [leaveType, setLeaveType] = useState<string>('annual');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [daysCount, setDaysCount] = useState<number>(1);
  const [notes, setNotes] = useState('');

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (editingRequest) {
        setSelectedEmployee({ id: editingRequest.user_id, name: editingRequest.employee_name });
        setLeaveType(editingRequest.leave_type);
        setStartDate(new Date(editingRequest.start_date));
        setEndDate(new Date(editingRequest.end_date));
        setDaysCount(editingRequest.days_count);
        setNotes(editingRequest.notes || '');
      } else {
        setSelectedEmployee(currentUser.id && currentUser.name ? { id: currentUser.id, name: currentUser.name } : null);
        setLeaveType('annual');
        setStartDate(undefined);
        setEndDate(undefined);
        setDaysCount(1);
        setNotes('');
      }
    }
  }, [open, editingRequest, currentUser]);

  // Auto-calculate days when dates change (weekdays only)
  useEffect(() => {
    if (startDate && endDate) {
      const days = calculateBusinessDays(startDate, endDate);
      setDaysCount(days);
    }
  }, [startDate, endDate]);

  const handleSubmit = () => {
    if (!selectedEmployee || !startDate || !endDate) return;

    onSubmit({
      user_id: selectedEmployee.id,
      employee_name: selectedEmployee.name,
      leave_type: leaveType as LeaveRequest['leave_type'],
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd'),
      days_count: daysCount,
      status: editingRequest?.status || 'pending',
      notes: notes || null,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingRequest ? 'Edit Leave Request' : 'Request Leave'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Employee selector (admin only) */}
          {isAdmin && employees.length > 0 && (
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select
                value={selectedEmployee?.id || ''}
                onValueChange={(value) => {
                  const emp = employees.find(e => e.id === value);
                  setSelectedEmployee(emp || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Leave type */}
          <div className="space-y-2">
            <Label>Leave Type</Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAVE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'MMM d, yyyy') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'MMM d, yyyy') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => startDate ? date < startDate : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Days count */}
          <div className="space-y-2">
            <Label>Number of Days</Label>
            <Input
              type="number"
              min={0.5}
              step={0.5}
              value={daysCount}
              onChange={(e) => setDaysCount(parseFloat(e.target.value) || 1)}
            />
            <p className="text-xs text-muted-foreground">
              Auto-calculated from dates (weekdays only). Adjust for half-days.
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Reason for leave..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!selectedEmployee || !startDate || !endDate}
            >
              {editingRequest ? 'Update' : 'Submit Request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
