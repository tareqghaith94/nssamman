import { useState } from 'react';
import { useClientAnalytics, ClientAnalytics } from '@/hooks/useClientAnalytics';
import { StatCard } from '@/components/ui/StatCard';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Users, Package, DollarSign, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SortKey = 'shipmentCount' | 'equipmentVolume' | 'totalRevenue' | 'totalProfit' | 'conversionRate';

export function TopClientsTab() {
  const { clientAnalytics, summary, isLoading } = useClientAnalytics();
  const [sortKey, setSortKey] = useState<SortKey>('shipmentCount');
  const [sortDesc, setSortDesc] = useState(true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  const sortedClients = [...clientAnalytics].sort((a, b) => {
    const multiplier = sortDesc ? -1 : 1;
    return (a[sortKey] - b[sortKey]) * multiplier;
  });

  const SortableHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-medium hover:bg-transparent"
      onClick={() => handleSort(sortKeyName)}
    >
      {label}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Clients"
          value={summary.totalClients}
          icon={<Users className="w-6 h-6" />}
        />
        <StatCard
          title="Top by Volume"
          value={summary.topByVolume 
            ? `${summary.topByVolume.clientName} (${summary.topByVolume.equipmentVolume})`
            : 'N/A'}
          icon={<Package className="w-6 h-6" />}
        />
        <StatCard
          title="Top by Revenue"
          value={summary.topByRevenue 
            ? `${summary.topByRevenue.clientName} ($${summary.topByRevenue.totalRevenue.toLocaleString()})`
            : 'N/A'}
          icon={<DollarSign className="w-6 h-6" />}
        />
      </div>

      {/* Client Analytics Table */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-heading text-lg font-semibold mb-4">Client Analytics</h3>
        
        {sortedClients.length === 0 ? (
          <p className="text-muted-foreground text-sm">No clients with shipments yet</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead className="text-right">
                    <SortableHeader label="Shipments" sortKeyName="shipmentCount" />
                  </TableHead>
                  <TableHead className="text-right">
                    <SortableHeader label="Volume" sortKeyName="equipmentVolume" />
                  </TableHead>
                  <TableHead className="text-right">
                    <SortableHeader label="Revenue" sortKeyName="totalRevenue" />
                  </TableHead>
                  <TableHead className="text-right">
                    <SortableHeader label="Profit" sortKeyName="totalProfit" />
                  </TableHead>
                  <TableHead className="text-right">
                    <SortableHeader label="Conv. Rate" sortKeyName="conversionRate" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedClients.map((client, index) => (
                  <TableRow key={client.clientName}>
                    <TableCell className="font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{client.clientName}</TableCell>
                    <TableCell className="text-right">{client.shipmentCount}</TableCell>
                    <TableCell className="text-right">{client.equipmentVolume}</TableCell>
                    <TableCell className="text-right">
                      ${client.totalRevenue.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ${client.totalProfit.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={client.conversionRate >= 50 ? 'text-success' : 'text-muted-foreground'}>
                        {client.conversionRate}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
