import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';
import { CommissionRule, FormulaType, CommissionConfig, FORMULA_TYPE_LABELS } from '@/types/commission';
import { CommissionRuleEditor } from './CommissionRuleEditor';
import { SALESPERSON_REF_PREFIX } from '@/types/permissions';

interface CommissionSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultRate: number;
  onUpdateDefaultRate: (rate: number) => void;
  rules: CommissionRule[];
  onSaveRule: (salesperson: string, formulaType: FormulaType, config: CommissionConfig) => void;
  onDeleteRule: (salesperson: string) => void;
  isUpdating: boolean;
}

export function CommissionSettingsDialog({
  open,
  onOpenChange,
  defaultRate,
  onUpdateDefaultRate,
  rules,
  onSaveRule,
  onDeleteRule,
  isUpdating,
}: CommissionSettingsDialogProps) {
  const [newRate, setNewRate] = useState(defaultRate.toString());
  const [editingSalesperson, setEditingSalesperson] = useState<string | null>(null);

  const salespeople = Object.keys(SALESPERSON_REF_PREFIX);
  
  const getRuleForSalesperson = (salesperson: string) => 
    rules.find(r => r.salesperson === salesperson);

  const handleUpdateDefaultRate = () => {
    const rate = parseFloat(newRate);
    if (!isNaN(rate) && rate >= 0 && rate <= 100) {
      onUpdateDefaultRate(rate);
    }
  };

  const editingRule = editingSalesperson ? getRuleForSalesperson(editingSalesperson) : undefined;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Commission Settings</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="default" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="default">Default Rate</TabsTrigger>
              <TabsTrigger value="rules">Per-Salesperson</TabsTrigger>
            </TabsList>

            <TabsContent value="default" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Default Commission Rate (%)</Label>
                <p className="text-sm text-muted-foreground">
                  Applied to salespeople without a custom rule
                </p>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    className="max-w-[120px]"
                  />
                  <Button 
                    onClick={handleUpdateDefaultRate}
                    disabled={isUpdating || parseFloat(newRate) === defaultRate}
                  >
                    Update
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rules" className="space-y-3 mt-4">
              <p className="text-sm text-muted-foreground">
                Configure custom commission formulas for each salesperson
              </p>
              
              <div className="space-y-2">
                {salespeople.map((salesperson) => {
                  const rule = getRuleForSalesperson(salesperson);
                  const hasCustomRule = !!rule;
                  
                  return (
                    <div 
                      key={salesperson}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{salesperson}</span>
                        {hasCustomRule ? (
                          <Badge variant="secondary">
                            {FORMULA_TYPE_LABELS[rule.formula_type]}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Default ({defaultRate}%)
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingSalesperson(salesperson)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        {hasCustomRule ? 'Edit' : 'Configure'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {editingSalesperson && (
        <CommissionRuleEditor
          open={!!editingSalesperson}
          onOpenChange={(open) => !open && setEditingSalesperson(null)}
          salesperson={editingSalesperson}
          currentFormulaType={editingRule?.formula_type}
          currentConfig={editingRule?.config}
          onSave={(formulaType, config) => {
            onSaveRule(editingSalesperson, formulaType, config);
            setEditingSalesperson(null);
          }}
          onDelete={editingRule ? () => {
            onDeleteRule(editingSalesperson);
            setEditingSalesperson(null);
          } : undefined}
        />
      )}
    </>
  );
}
