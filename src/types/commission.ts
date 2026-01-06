export type FormulaType = 'flat_percentage' | 'gp_minus_salary' | 'tiered';

export interface FlatConfig {
  percentage: number;
}

export interface SalaryConfig {
  percentage: number;
  salary_multiplier: number;
}

export interface TierConfig {
  min: number;
  max: number | null;
  percentage: number;
}

export interface TieredConfig {
  tiers: TierConfig[];
}

export type CommissionConfig = FlatConfig | SalaryConfig | TieredConfig;

export interface CommissionRule {
  id: string;
  salesperson: string;
  formula_type: FormulaType;
  config: CommissionConfig;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface SalaryInputs {
  [salesperson: string]: number;
}

export const FORMULA_TYPE_LABELS: Record<FormulaType, string> = {
  flat_percentage: 'Flat Percentage',
  gp_minus_salary: 'GP Minus Salary',
  tiered: 'Tiered Thresholds',
};
