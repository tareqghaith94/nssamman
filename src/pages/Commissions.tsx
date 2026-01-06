import { useMemo, useState } from 'react';
import { useShipments } from '@/hooks/useShipments';
import { useAuth } from '@/hooks/useAuth';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useCommissionRules } from '@/hooks/useCommissionRules';
import { useCommissionCalculation } from '@/hooks/useCommissionCalculation';
import { PageHeader } from '@/components/ui/PageHeader';
import { StageFilter } from '@/components/ui/StageFilter';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DollarSign, TrendingUp, User, Settings } from 'lucide-react';
import { Shipment } from '@/types/shipment';
import { UserRole } from '@/types/permissions';
import { SalaryInputs, FORMULA_TYPE_LABELS } from '@/types/commission';
import { CommissionSettingsDialog } from '@/components/commissions/CommissionSettingsDialog';
import { SalaryInputCard } from '@/components/commissions/SalaryInputCard';
import { CommissionBreakdownTooltip } from '@/components/commissions/CommissionBreakdownTooltip';

export default function Commissions() {
  const { shipments, isLoading } = useShipments();
  const { profile, roles } = useAuth();
  const { getCommissionPercentage, updateCommissionRate, isUpdating, canEdit } = useAppSettings();
  const { rules, upsertRule, deleteRule, isUpdating: isRulesUpdating } = useCommissionRules();
  
  const [showHistory, setShowHistory] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [salaryInputs, setSalaryInputs] = useState<SalaryInputs>({});
  
  // Use roles from auth for multi-role support
  const userRoles = (roles || []) as UserRole[];
  const refPrefix = profile?.ref_prefix || undefined;
  
  // Sales users only see their own shipments (by ref prefix)
  const isSalesOnly = userRoles.includes('sales') && !userRoles.includes('admin');
  
  const defaultPercentage = getCommissionPercentage();
  
  const { calculateForSalesperson, getRuleForSalesperson, salespeopleNeedingSalary } = 
    useCommissionCalculation(rules, defaultPercentage, salaryInputs);

  const handleSalaryChange = (salesperson: string, salary: number) => {
    setSalaryInputs(prev => ({ ...prev, [salesperson]: salary }));
  };

  const commissions = useMemo(() => {
    // Filter shipments based on view mode
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
    
    return Object.entries(bySalesperson).map(([salesperson, ships]) => {
      const rule = getRuleForSalesperson(salesperson);
      
      // Calculate commissions for each shipment
      const shipmentCommissions = ships.map(s => ({
        shipment: s,
        breakdown: calculateForSalesperson(salesperson, s.totalProfit || 0),
      }));
      
      return {
        salesperson,
        rule,
        shipments: ships,
        shipmentCommissions,
        totalCommission: shipmentCommissions
          .filter(sc => sc.shipment.paymentCollected)
          .reduce((sum, sc) => sum + sc.breakdown.commission, 0),
        pendingCommission: shipmentCommissions
          .filter(sc => !sc.shipment.paymentCollected)
          .reduce((sum, sc) => sum + sc.breakdown.commission, 0),
        totalGP: ships.reduce((sum, s) => sum + (s.totalProfit || 0), 0),
      };
    });
  }, [shipments, isSalesOnly, refPrefix, showHistory, calculateForSalesperson, getRuleForSalesperson]);
  
  const totalCommission = commissions.reduce((sum, c) => sum + c.totalCommission, 0);
  const totalGP = commissions.reduce((sum, c) => sum + c.totalGP, 0);
  
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
          ? "Your commissions on collected shipments"
          : "Sales team commissions on collected shipments"
        }
        action={
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            )}
            <StageFilter showHistory={showHistory} onToggle={setShowHistory} />
          </div>
        }
      />

      {/* Salary Input Card */}
      <div className="mb-6">
        <SalaryInputCard
          salespeopleNeedingSalary={salespeopleNeedingSalary}
          salaryInputs={salaryInputs}
          onSalaryChange={handleSalaryChange}
        />
      </div>
      
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
              <p className="text-sm text-muted-foreground">Total Commission</p>
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
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{commission.salesperson}</p>
                          {commission.rule && (
                            <Badge variant="secondary" className="text-xs">
                              {FORMULA_TYPE_LABELS[commission.rule.formula_type]}
                            </Badge>
                          )}
                        </div>
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
                          <TableHead className="text-muted-foreground text-right">Commission</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commission.shipmentCommissions.map(({ shipment, breakdown }) => (
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
                              <span className="inline-flex items-center">
                                ${breakdown.commission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                {!shipment.paymentCollected && " (pending)"}
                                <CommissionBreakdownTooltip breakdown={breakdown} />
                              </span>
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

      {/* Settings Dialog */}
      <CommissionSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        defaultRate={defaultPercentage}
        onUpdateDefaultRate={updateCommissionRate}
        rules={rules}
        onSaveRule={(salesperson, formulaType, config) => {
          upsertRule({ salesperson, formula_type: formulaType, config });
        }}
        onDeleteRule={(salesperson) => deleteRule(salesperson)}
        isUpdating={isUpdating || isRulesUpdating}
      />
    </div>
  );
}
