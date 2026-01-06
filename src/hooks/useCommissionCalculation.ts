import { useMemo } from 'react';
import { CommissionRule, FlatConfig, SalaryConfig, TieredConfig, SalaryInputs } from '@/types/commission';

export interface CommissionBreakdown {
  grossProfit: number;
  salary?: number;
  salaryMultiplier?: number;
  salaryDeduction?: number;
  base?: number;
  tier?: { min: number; max: number | null; percentage: number };
  percentage: number;
  commission: number;
  formula: string;
}

function calculateTieredCommission(grossProfit: number, tiers: TieredConfig['tiers']): { commission: number; tier: TieredConfig['tiers'][0]; percentage: number } {
  // Sort tiers by min value
  const sortedTiers = [...tiers].sort((a, b) => a.min - b.min);
  
  // Find the applicable tier
  for (const tier of sortedTiers) {
    const maxValue = tier.max ?? Infinity;
    if (grossProfit >= tier.min && grossProfit < maxValue) {
      return {
        commission: grossProfit * (tier.percentage / 100),
        tier,
        percentage: tier.percentage,
      };
    }
  }
  
  // If above all tiers, use the highest tier
  const highestTier = sortedTiers[sortedTiers.length - 1];
  if (highestTier && grossProfit >= (highestTier.max ?? 0)) {
    return {
      commission: grossProfit * (highestTier.percentage / 100),
      tier: highestTier,
      percentage: highestTier.percentage,
    };
  }
  
  return { commission: 0, tier: sortedTiers[0], percentage: 0 };
}

export function calculateCommission(
  grossProfit: number,
  rule: CommissionRule | undefined,
  defaultPercentage: number,
  salary?: number
): CommissionBreakdown {
  if (!rule) {
    // Use default flat percentage
    const commission = grossProfit * (defaultPercentage / 100);
    return {
      grossProfit,
      percentage: defaultPercentage,
      commission,
      formula: `${grossProfit.toLocaleString()} × ${defaultPercentage}% = ${commission.toLocaleString()}`,
    };
  }

  switch (rule.formula_type) {
    case 'flat_percentage': {
      const config = rule.config as FlatConfig;
      const commission = grossProfit * (config.percentage / 100);
      return {
        grossProfit,
        percentage: config.percentage,
        commission,
        formula: `${grossProfit.toLocaleString()} × ${config.percentage}% = ${commission.toLocaleString()}`,
      };
    }

    case 'gp_minus_salary': {
      const config = rule.config as SalaryConfig;
      const salaryDeduction = config.salary_multiplier * (salary || 0);
      const base = Math.max(0, grossProfit - salaryDeduction);
      const commission = base * (config.percentage / 100);
      
      return {
        grossProfit,
        salary: salary || 0,
        salaryMultiplier: config.salary_multiplier,
        salaryDeduction,
        base,
        percentage: config.percentage,
        commission,
        formula: salary 
          ? `(${grossProfit.toLocaleString()} - ${config.salary_multiplier}×${salary.toLocaleString()}) × ${config.percentage}% = ${commission.toLocaleString()}`
          : `Enter salary to calculate`,
      };
    }

    case 'tiered': {
      const config = rule.config as TieredConfig;
      const result = calculateTieredCommission(grossProfit, config.tiers);
      
      return {
        grossProfit,
        tier: result.tier,
        percentage: result.percentage,
        commission: result.commission,
        formula: `${grossProfit.toLocaleString()} @ ${result.percentage}% = ${result.commission.toLocaleString()}`,
      };
    }

    default:
      return {
        grossProfit,
        percentage: defaultPercentage,
        commission: grossProfit * (defaultPercentage / 100),
        formula: 'Unknown formula type',
      };
  }
}

export function useCommissionCalculation(
  rules: CommissionRule[],
  defaultPercentage: number,
  salaryInputs: SalaryInputs
) {
  const getRuleForSalesperson = useMemo(() => {
    const ruleMap = new Map(rules.map(r => [r.salesperson, r]));
    return (salesperson: string) => ruleMap.get(salesperson);
  }, [rules]);

  const calculateForSalesperson = (
    salesperson: string,
    grossProfit: number
  ): CommissionBreakdown => {
    const rule = getRuleForSalesperson(salesperson);
    const salary = salaryInputs[salesperson];
    return calculateCommission(grossProfit, rule, defaultPercentage, salary);
  };

  const salespeopleNeedingSalary = useMemo(() => {
    return rules
      .filter(r => r.formula_type === 'gp_minus_salary')
      .map(r => r.salesperson);
  }, [rules]);

  return {
    calculateForSalesperson,
    getRuleForSalesperson,
    salespeopleNeedingSalary,
  };
}
