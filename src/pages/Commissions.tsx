import { useMemo } from 'react';
import { useShipmentStore } from '@/store/shipmentStore';
import { PageHeader } from '@/components/ui/PageHeader';
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
import { DollarSign, TrendingUp, User } from 'lucide-react';
import { Shipment } from '@/types/shipment';

export default function Commissions() {
  const shipments = useShipmentStore((s) => s.shipments);

  const commissions = useMemo(() => {
    const collectedShipments = shipments.filter(
      (s) => s.stage === 'completed' && s.paymentCollected && s.totalProfit
    );
    
    const bySalesperson = collectedShipments.reduce((acc, s) => {
      if (!acc[s.salesperson]) {
        acc[s.salesperson] = [];
      }
      acc[s.salesperson].push(s);
      return acc;
    }, {} as Record<string, Shipment[]>);
    
    return Object.entries(bySalesperson).map(([salesperson, ships]) => ({
      salesperson,
      shipments: ships,
      totalCommission: ships.reduce((sum, s) => sum + (s.totalProfit || 0) * 0.04, 0),
    }));
  }, [shipments]);
  
  const totalCommission = commissions.reduce((sum, c) => sum + c.totalCommission, 0);
  const totalGP = commissions.reduce(
    (sum, c) => sum + c.shipments.reduce((s, sh) => s + (sh.totalProfit || 0), 0),
    0
  );
  
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Commissions"
        description="Sales team commissions (4% of Gross Profit on collected shipments)"
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
              <p className="text-sm text-muted-foreground">Total Commission (4%)</p>
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
                          {commission.shipments.length} collected shipment(s)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-primary">
                        ${commission.totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground">Commission</p>
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
                          <TableHead className="text-muted-foreground">Collected Date</TableHead>
                          <TableHead className="text-muted-foreground text-right">Gross Profit</TableHead>
                          <TableHead className="text-muted-foreground text-right">Commission (4%)</TableHead>
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
                              {shipment.paymentCollectedDate && 
                                format(new Date(shipment.paymentCollectedDate), 'dd MMM yyyy')}
                            </TableCell>
                            <TableCell className="text-right font-medium text-success">
                              ${shipment.totalProfit?.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-medium text-primary">
                              ${((shipment.totalProfit || 0) * 0.04).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
