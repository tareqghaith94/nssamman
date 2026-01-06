import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SalaryInputs } from '@/types/commission';
import { DollarSign } from 'lucide-react';

interface SalaryInputCardProps {
  salespeopleNeedingSalary: string[];
  salaryInputs: SalaryInputs;
  onSalaryChange: (salesperson: string, salary: number) => void;
}

export function SalaryInputCard({
  salespeopleNeedingSalary,
  salaryInputs,
  onSalaryChange,
}: SalaryInputCardProps) {
  if (salespeopleNeedingSalary.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Salary Inputs Required
        </CardTitle>
        <CardDescription>
          Enter salaries for salespeople using GP-minus-salary formula
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {salespeopleNeedingSalary.map((salesperson) => (
            <div key={salesperson} className="space-y-1">
              <Label className="text-sm">{salesperson}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={salaryInputs[salesperson] || ''}
                  onChange={(e) => onSalaryChange(salesperson, parseFloat(e.target.value) || 0)}
                  className="pl-7"
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
