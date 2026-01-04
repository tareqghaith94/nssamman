import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { Search, Trash2, FileText, ArrowRight, Edit, AlertTriangle, DollarSign, Upload } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { ActivityType } from '@/types/activity';

const activityTypeLabels: Record<ActivityType, { label: string; icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  created: { label: 'Created', icon: <FileText className="w-3 h-3" />, variant: 'default' },
  stage_change: { label: 'Stage Change', icon: <ArrowRight className="w-3 h-3" />, variant: 'secondary' },
  field_update: { label: 'Field Update', icon: <Edit className="w-3 h-3" />, variant: 'outline' },
  marked_lost: { label: 'Marked Lost', icon: <AlertTriangle className="w-3 h-3" />, variant: 'destructive' },
  payment_collected: { label: 'Payment Collected', icon: <DollarSign className="w-3 h-3" />, variant: 'default' },
  agent_paid: { label: 'Agent Paid', icon: <DollarSign className="w-3 h-3" />, variant: 'default' },
  invoice_uploaded: { label: 'Invoice Uploaded', icon: <Upload className="w-3 h-3" />, variant: 'outline' },
};

export default function ActivityLog() {
  const { isAdmin } = useAuth();
  const { activities, clearActivities, isLoading } = useActivityLogs();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Only admin can access this page
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.referenceId.toLowerCase().includes(search.toLowerCase()) ||
      activity.description.toLowerCase().includes(search.toLowerCase()) ||
      activity.user.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || activity.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Log"
        description="View all shipment activity and changes"
      />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by reference, user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(activityTypeLabels).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => clearActivities()}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear Log
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Timestamp</TableHead>
              <TableHead className="w-[140px]">Reference</TableHead>
              <TableHead className="w-[140px]">Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[120px]">User</TableHead>
              <TableHead className="w-[100px]">Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredActivities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No activity recorded yet
                </TableCell>
              </TableRow>
            ) : (
              filteredActivities.map((activity) => {
                const typeInfo = activityTypeLabels[activity.type];
                return (
                  <TableRow key={activity.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(activity.timestamp, 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {activity.referenceId}
                    </TableCell>
                    <TableCell>
                      <Badge variant={typeInfo.variant} className="gap-1">
                        {typeInfo.icon}
                        {typeInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <span className="text-sm">{activity.description}</span>
                      {activity.previousValue && activity.newValue && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {activity.previousValue} → {activity.newValue}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{activity.user}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {activity.userRole}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredActivities.length} of {activities.length} activities
      </div>
    </div>
  );
}
