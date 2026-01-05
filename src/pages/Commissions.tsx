import { useMemo, useState } from 'react';
import { useShipments } from '@/hooks/useShipments';
import { useAuth } from '@/hooks/useAuth';
import { useAppSettings } from '@/hooks/useAppSettings';
import { PageHeader } from '@/components/ui/PageHeader';
import { StageFilter } from '@/components/ui/StageFilter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DollarSign, TrendingUp, User, Settings, Percent } from 'lucide-react';
import { Shipment } from '@/types/shipment';
import { UserRole } from '@/types/permissions';
import { toast } from 'sonner';

export default function Commissions() {
  const { shipments, isLoading } = useShipments();
  const { profile, roles } = useAuth();
  const { getCommissionRate, getCommissionPercentage, updateCommissionRate, isUpdating, canEdit } = useAppSettings();
  const [showHistory, setShowHistory] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newRate, setNewRate] = useState<string>('');
  
  // Use roles from auth for multi-role support
  const userRoles = (roles || []) as UserRole[];
  const refPrefix = profile?.ref_prefix || undefined;
  
  // Sales users only see their own shipments (by ref prefix)
  // Check if user has sales role but NOT admin role
  const isSalesOnly = userRoles.includes('sales') && !userRoles.includes('admin');
  
  const commissionRate = getCommissionRate();
  const commissionPercentage = getCommissionPercentage();

  const commissions = useMemo(() => {
    // Current: Only collected shipments (completed + payment collected + has profit)
    // History: All completed shipments with profit (collected or not)
    let filteredShipments = showHistory
      ? shipments.filter((s) => s.stage === 'completed' && s.totalProfit)
      : shipments.filter((s) => s.stage === 'completed' && s.paymentCollected && s.totalProfit);
    
    // Sales-only users see only their own shipments
    if (isSalesOnly && refPrefix) {
      filteredShipments = filteredShipments.filter(
        (s) => s.referenceId.startsWith(`${refPrefix}-`)
      );
    }
    
    const bySalesperson = filteredShipments.reduce((acc, s) => {
      if (!acc[s.salesperson]) {
        acc[s.salesperson] = [];
      }
      acc[s.salesperson].push(s);
      return acc;
    }, {} as Record<string, Shipment[]>);
    
    return Object.entries(bySalesperson).map(([salesperson, ships]) => ({
      salesperson,
      shipments: ships,
      // Only count commission for collected shipments
      totalCommission: ships.reduce((sum, s) => sum + (s.paymentCollected ? (s.totalProfit || 0) * commissionRate : 0), 0),
      pendingCommission: ships.reduce((sum, s) => sum + (!s.paymentCollected ? (s.totalProfit || 0) * commissionRate : 0), 0),
    }));
  }, [shipments, isSalesOnly, refPrefix, showHistory, commissionRate]);
  
  const totalCommission = commissions.reduce((sum, c) => sum + c.totalCommission, 0);
  const totalGP = commissions.reduce(
    (sum, c) => sum + c.shipments.reduce((s, sh) => s + (sh.totalProfit || 0), 0),
    0
  );
  
  const totalPendingCommission = commissions.reduce((sum, c) => sum + c.pendingCommission, 0);
  
  const handleUpdateRate = async () => {
    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Please enter a valid percentage between 0 and 100');
      return;
    }
    
    try {
      await updateCommissionRate(rate);
      toast.success(`Commission rate updated to ${rate}%`);
      setSettingsOpen(false);
      setNewRate('');
    } catch (error) {
      toast.error('Failed to update commission rate');
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isSalesOnly ? "My Commissions" : "Commissions"}
        description={isSalesOnly 
          ? `Your commissions (${commissionPercentage}% of Gross Profit on collected shipments)`
          : `Sales team commissions (${commissionPercentage}% of Gross Profit on collected shipments)`
        }
        action={
          <div className="flex items-center gap-2">
            {canEdit && (
              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Percent className="w-5 h-5" />
                      Commission Rate Settings
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Current Rate</p>
                        <p className="text-2xl font-bold text-primary">{commissionPercentage}%</p>
                      </div>
                      <div className="text-muted-foreground text-sm">
                        of Gross Profit
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newRate">New Commission Rate (%)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="newRate"
                          type="number"
                          min={0}
                          max={100}
                          step={0.5}
                          value={newRate}
                          onChange={(e) => setNewRate(e.target.value)}
                          placeholder={`${commissionPercentage}`}
                        />
                        <Button 
                          onClick={handleUpdateRate} 
                          disabled={isUpdating || !newRate}
                        >
                          {isUpdating ? 'Saving...' : 'Update'}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This will apply to all future commission calculations
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <StageFilter showHistory={showHistory} onToggle={setShowHistory} />
          </div>
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Salespeople</p>
              <p className="text-2xl font-heading font-bold mt-1">{commissions.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <User className="w-6 h-6" />
            </div>
          </div>
        </div>
        
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Gross Profit</p>
              <p className="text-2xl font-heading font-bold mt-1">${totalGP.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center text-success">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
        
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Commission ({commissionPercentage}%)</p>
              <p className="text-2xl font-heading font-bold mt-1 text-primary">
                ${totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>
      
      {commissions.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <p className="text-muted-foreground">
            No commissions yet. Commissions are calculated when payments are collected on completed shipments.
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <Accordion type="single" collapsible className="w-full">
            {commissions.map((commission) => (
              <AccordionItem key={commission.salesperson} value={commission.salesperson} className="border-border/50">
                <AccordionTrigger className="px-6 hover:no-underline hover:bg-muted/30">
                  <div className="flex items-center justify-between w-full mr-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                        {commission.salesperson.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{commission.salesperson}</p>
                        <p className="text-sm text-muted-foreground">
                          {commission.shipments.filter(s => s.paymentCollected).length} collected
                          {showHistory && commission.shipments.filter(s => !s.paymentCollected).length > 0 && 
                            `, ${commission.shipments.filter(s => !s.paymentCollected).length} pending`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-primary">
                        ${commission.totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {showHistory && commission.pendingCommission > 0 
                          ? `Collected (+$${commission.pendingCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })} pending)`
                          : 'Commission'
                        }
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-6 pb-4">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50 hover:bg-transparent">
                          <TableHead className="text-muted-foreground">Reference ID</TableHead>
                          <TableHead className="text-muted-foreground">Route</TableHead>
                          <TableHead className="text-muted-foreground">Status</TableHead>
                          <TableHead className="text-muted-foreground text-right">Gross Profit</TableHead>
                          <TableHead className="text-muted-foreground text-right">Commission ({commissionPercentage}%)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commission.shipments.map((shipment) => (
                          <TableRow key={shipment.id} className="border-border/50">
                            <TableCell className="font-mono text-primary">
                              {shipment.referenceId}
                            </TableCell>
                            <TableCell>
                              {shipment.portOfLoading} → {shipment.portOfDischarge}
                            </TableCell>
                            <TableCell>
                              {shipment.paymentCollected ? (
                                <span className="text-success text-sm">
                                  Collected {shipment.paymentCollectedDate && format(new Date(shipment.paymentCollectedDate), 'dd MMM yyyy')}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-sm">Pending</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium text-success">
                              ${shipment.totalProfit?.toLocaleString()}
                            </TableCell>
                            <TableCell className={cn(
                              "text-right font-medium",
                              shipment.paymentCollected ? "text-primary" : "text-muted-foreground"
                            )}>
                              ${((shipment.totalProfit || 0) * commissionRate).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              {!shipment.paymentCollected && " (pending)"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  );
}
