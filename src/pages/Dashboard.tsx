import { useFilteredShipments } from '@/hooks/useFilteredShipments';
import { useUserStore } from '@/store/userStore';
import { canSeeShipment } from '@/lib/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { 
  Users, 
  Calculator, 
  CheckCircle, 
  Truck, 
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock
} from 'lucide-react';
import { isBefore, addDays } from 'date-fns';
import { useMemo } from 'react';

export default function Dashboard() {
  const shipments = useFilteredShipments();
  const currentUser = useUserStore((s) => s.currentUser);
  
  const leads = shipments.filter((s) => s.stage === 'lead').length;
  const pricing = shipments.filter((s) => s.stage === 'pricing').length;
  const confirmed = shipments.filter((s) => s.stage === 'confirmed').length;
  const operations = shipments.filter((s) => s.stage === 'operations').length;
  const completed = shipments.filter((s) => s.stage === 'completed').length;
  
  // Calculate payables for filtered shipments
  const payables = useMemo(() => {
    return shipments
      .filter((s) => (s.stage === 'operations' || s.stage === 'completed') && s.agent && s.totalCost && !s.agentPaid)
      .map((s) => {
        const isExport = s.portOfLoading.toLowerCase().includes('aqaba');
        let reminderDate: Date;
        if (isExport && s.etd) {
          reminderDate = addDays(new Date(s.etd), 3);
        } else if (s.eta) {
          reminderDate = addDays(new Date(s.eta), -10);
        } else {
          reminderDate = new Date();
        }
        return { shipment: s, reminderDate };
      });
  }, [shipments]);
  
  // Calculate collections for filtered shipments
  const collections = useMemo(() => {
    return shipments
      .filter((s) => s.stage === 'completed' && s.completedAt && !s.paymentCollected)
      .map((s) => {
        const daysToAdd = parseInt(s.paymentTerms) || 0;
        const dueDate = addDays(new Date(s.completedAt!), daysToAdd);
        return { shipment: s, dueDate };
      });
  }, [shipments]);
  
  const overduePayables = payables.filter(p => isBefore(p.reminderDate, new Date())).length;
  const overdueCollections = collections.filter(c => isBefore(c.dueDate, new Date())).length;
  
  const totalRevenue = shipments
    .filter((s) => s.stage === 'completed')
    .reduce((sum, s) => sum + (s.totalInvoiceAmount || 0), 0);
  
  const totalProfit = shipments
    .filter((s) => s.stage === 'completed')
    .reduce((sum, s) => sum + (s.totalProfit || 0), 0);
  
  const recentShipments = [...shipments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  
  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Dashboard" 
        description={currentUser.role === 'sales' ? `Overview for ${currentUser.name}` : 'Overview of your freight forwarding operations'}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Active Leads"
          value={leads}
          icon={<Users className="w-6 h-6" />}
        />
        <StatCard
          title="Pending Pricing"
          value={pricing}
          icon={<Calculator className="w-6 h-6" />}
        />
        <StatCard
          title="In Operations"
          value={operations}
          icon={<Truck className="w-6 h-6" />}
        />
        <StatCard
          title="Completed"
          value={completed}
          icon={<CheckCircle className="w-6 h-6" />}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="w-6 h-6" />}
        />
        <StatCard
          title="Total Profit"
          value={`$${totalProfit.toLocaleString()}`}
          icon={<TrendingUp className="w-6 h-6" />}
        />
        <StatCard
          title="Pending Collections"
          value={collections.length}
          icon={<Clock className="w-6 h-6" />}
        />
      </div>
      
      {(overduePayables > 0 || overdueCollections > 0) && (
        <div className="mb-8 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <div>
            <p className="font-medium text-destructive">Attention Required</p>
            <p className="text-sm text-muted-foreground">
              {overduePayables > 0 && `${overduePayables} overdue payable(s)`}
              {overduePayables > 0 && overdueCollections > 0 && ' • '}
              {overdueCollections > 0 && `${overdueCollections} overdue collection(s)`}
            </p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-heading text-lg font-semibold mb-4">Recent Shipments</h3>
          <div className="space-y-3">
            {recentShipments.length === 0 ? (
              <p className="text-muted-foreground text-sm">No shipments yet</p>
            ) : (
              recentShipments.map((shipment) => (
                <div
                  key={shipment.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div>
                    <p className="font-mono text-sm text-primary">{shipment.referenceId}</p>
                    <p className="text-sm text-muted-foreground">
                      {shipment.portOfLoading} → {shipment.portOfDischarge}
                    </p>
                  </div>
                  <StatusBadge stage={shipment.stage} />
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-heading text-lg font-semibold mb-4">Pipeline Summary</h3>
          <div className="space-y-4">
            {[
              { label: 'Leads', count: leads, color: 'bg-warning' },
              { label: 'Pricing', count: pricing, color: 'bg-info' },
              { label: 'Confirmed', count: confirmed, color: 'bg-primary' },
              { label: 'Operations', count: operations, color: 'bg-info' },
              { label: 'Completed', count: completed, color: 'bg-success' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4">
                <div className="w-24 text-sm text-muted-foreground">{item.label}</div>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} transition-all duration-500`}
                    style={{
                      width: `${shipments.length > 0 ? (item.count / shipments.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <div className="w-8 text-sm font-medium text-right">{item.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
