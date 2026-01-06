import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CommissionBreakdown } from '@/hooks/useCommissionCalculation';
import { Info } from 'lucide-react';

interface CommissionBreakdownTooltipProps {
  breakdown: CommissionBreakdown;
  children?: React.ReactNode;
}

export function CommissionBreakdownTooltip({ breakdown, children }: CommissionBreakdownTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children || (
            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help inline ml-1" />
          )}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Gross Profit:</span>
              <span className="font-medium">${breakdown.grossProfit.toLocaleString()}</span>
            </div>
            
            {breakdown.salary !== undefined && (
              <>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Salary:</span>
                  <span>${breakdown.salary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Deduction ({breakdown.salaryMultiplier}×):</span>
                  <span>-${breakdown.salaryDeduction?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Base:</span>
                  <span>${breakdown.base?.toLocaleString()}</span>
                </div>
              </>
            )}
            
            {breakdown.tier && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Tier:</span>
                <span>
                  ${breakdown.tier.min.toLocaleString()}
                  {breakdown.tier.max ? ` - $${breakdown.tier.max.toLocaleString()}` : '+'}
                </span>
              </div>
            )}
            
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Rate:</span>
              <span>{breakdown.percentage}%</span>
            </div>
            
            <div className="border-t pt-1 mt-1 flex justify-between gap-4 font-medium">
              <span>Commission:</span>
              <span>${breakdown.commission.toLocaleString()}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
