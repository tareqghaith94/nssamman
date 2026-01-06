import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import {
  FormulaType,
  CommissionConfig,
  FlatConfig,
  SalaryConfig,
  TieredConfig,
  TierConfig,
  FORMULA_TYPE_LABELS,
} from '@/types/commission';

interface CommissionRuleEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesperson: string;
  currentFormulaType?: FormulaType;
  currentConfig?: CommissionConfig;
  onSave: (formulaType: FormulaType, config: CommissionConfig) => void;
  onDelete?: () => void;
}

export function CommissionRuleEditor({
  open,
  onOpenChange,
  salesperson,
  currentFormulaType = 'flat_percentage',
  currentConfig,
  onSave,
  onDelete,
}: CommissionRuleEditorProps) {
  const [formulaType, setFormulaType] = useState<FormulaType>(currentFormulaType);
  
  // Flat percentage config
  const [flatPercentage, setFlatPercentage] = useState(5);
  
  // GP minus salary config
  const [salaryPercentage, setSalaryPercentage] = useState(10);
  const [salaryMultiplier, setSalaryMultiplier] = useState(3);
  
  // Tiered config
  const [tiers, setTiers] = useState<TierConfig[]>([
    { min: 0, max: 10000, percentage: 3 },
    { min: 10000, max: 25000, percentage: 5 },
    { min: 25000, max: null, percentage: 7 },
  ]);

  // Initialize from current config
  useEffect(() => {
    if (currentConfig) {
      setFormulaType(currentFormulaType);
      
      if (currentFormulaType === 'flat_percentage') {
        setFlatPercentage((currentConfig as FlatConfig).percentage);
      } else if (currentFormulaType === 'gp_minus_salary') {
        const config = currentConfig as SalaryConfig;
        setSalaryPercentage(config.percentage);
        setSalaryMultiplier(config.salary_multiplier);
      } else if (currentFormulaType === 'tiered') {
        setTiers((currentConfig as TieredConfig).tiers);
      }
    }
  }, [currentConfig, currentFormulaType, open]);

  const handleAddTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newMin = lastTier?.max ?? 0;
    setTiers([
      ...tiers.slice(0, -1),
      { ...lastTier, max: newMin },
      { min: newMin, max: null, percentage: (lastTier?.percentage ?? 5) + 2 },
    ]);
  };

  const handleRemoveTier = (index: number) => {
    if (tiers.length <= 1) return;
    const newTiers = tiers.filter((_, i) => i !== index);
    // Adjust the last tier to have no max
    if (newTiers.length > 0) {
      newTiers[newTiers.length - 1].max = null;
    }
    setTiers(newTiers);
  };

  const handleTierChange = (index: number, field: keyof TierConfig, value: number | null) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    
    // Auto-adjust next tier's min if we change current tier's max
    if (field === 'max' && index < tiers.length - 1 && value !== null) {
      newTiers[index + 1] = { ...newTiers[index + 1], min: value };
    }
    
    setTiers(newTiers);
  };

  const handleSave = () => {
    let config: CommissionConfig;
    
    switch (formulaType) {
      case 'flat_percentage':
        config = { percentage: flatPercentage };
        break;
      case 'gp_minus_salary':
        config = { percentage: salaryPercentage, salary_multiplier: salaryMultiplier };
        break;
      case 'tiered':
        config = { tiers };
        break;
      default:
        config = { percentage: 5 };
    }
    
    onSave(formulaType, config);
    onOpenChange(false);
  };

  const getFormulaPreview = () => {
    switch (formulaType) {
      case 'flat_percentage':
        return `Gross Profit × ${flatPercentage}%`;
      case 'gp_minus_salary':
        return `(Gross Profit - ${salaryMultiplier}× Salary) × ${salaryPercentage}%`;
      case 'tiered':
        return tiers.map(t => 
          `${t.percentage}% for $${t.min.toLocaleString()}${t.max ? ` - $${t.max.toLocaleString()}` : '+'}`
        ).join(', ');
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Commission Rule for {salesperson}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Formula Type Selector */}
          <div className="space-y-2">
            <Label>Formula Type</Label>
            <Select value={formulaType} onValueChange={(v) => setFormulaType(v as FormulaType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FORMULA_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Flat Percentage Config */}
          {formulaType === 'flat_percentage' && (
            <div className="space-y-2">
              <Label>Commission Percentage (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={flatPercentage}
                onChange={(e) => setFlatPercentage(parseFloat(e.target.value) || 0)}
              />
            </div>
          )}

          {/* GP Minus Salary Config */}
          {formulaType === 'gp_minus_salary' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Salary Multiplier</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={salaryMultiplier}
                  onChange={(e) => setSalaryMultiplier(parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  The salary will be multiplied by this number and deducted from GP
                </p>
              </div>
              <div className="space-y-2">
                <Label>Commission Percentage (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={salaryPercentage}
                  onChange={(e) => setSalaryPercentage(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          )}

          {/* Tiered Config */}
          {formulaType === 'tiered' && (
            <div className="space-y-3">
              <Label>Tiers</Label>
              {tiers.map((tier, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Min ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={tier.min}
                        onChange={(e) => handleTierChange(index, 'min', parseInt(e.target.value) || 0)}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Max ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={tier.max ?? ''}
                        placeholder="∞"
                        onChange={(e) => handleTierChange(index, 'max', e.target.value ? parseInt(e.target.value) : null)}
                        className="h-8"
                        disabled={index === tiers.length - 1}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Rate (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={tier.percentage}
                        onChange={(e) => handleTierChange(index, 'percentage', parseFloat(e.target.value) || 0)}
                        className="h-8"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleRemoveTier(index)}
                    disabled={tiers.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={handleAddTier} className="w-full">
                <Plus className="h-4 w-4 mr-1" /> Add Tier
              </Button>
            </div>
          )}

          {/* Formula Preview */}
          <div className="p-3 bg-muted rounded-md">
            <Label className="text-xs text-muted-foreground">Formula Preview</Label>
            <p className="text-sm font-medium mt-1">{getFormulaPreview()}</p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {onDelete && (
            <Button variant="destructive" onClick={onDelete} className="sm:mr-auto">
              Reset to Default
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Rule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
