import { Quotation } from '@/types/quotation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, FileText, Pencil } from 'lucide-react';
import { format } from 'date-fns';

interface QuotationTableProps {
  quotations: Quotation[];
  onView: (quotation: Quotation) => void;
  onEdit?: (quotation: Quotation) => void;
  onGeneratePDF: (quotation: Quotation) => void;
}

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  issued: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
  accepted: 'bg-green-500/20 text-green-600 dark:text-green-400',
  expired: 'bg-destructive/20 text-destructive',
};

export function QuotationTable({ quotations, onView, onEdit, onGeneratePDF }: QuotationTableProps) {
  const getTotalUnits = (quotation: Quotation) => {
    return quotation.equipment.reduce((sum, eq) => sum + eq.quantity, 0);
  };

  const getTotal = (quotation: Quotation) => {
    const units = getTotalUnits(quotation);
    const oceanTotal = (quotation.oceanFreightAmount || 0) * units;
    const exwTotal = (quotation.exwAmount || 0) * (quotation.exwQty || 0);
    return oceanTotal + exwTotal;
  };

  if (quotations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No quotations found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Route</TableHead>
            <TableHead>Equipment</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotations.map((quotation) => (
            <TableRow key={quotation.id}>
              <TableCell className="font-medium">{quotation.referenceId || quotation.quoteNumber}</TableCell>
              <TableCell>{quotation.clientName}</TableCell>
              <TableCell>
                <span className="text-sm">
                  {quotation.pol} → {quotation.pod}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {quotation.equipment.map(e => `${e.quantity}x ${e.type}`).join(', ')}
                </span>
              </TableCell>
              <TableCell className="text-right font-medium">
                ${getTotal(quotation).toLocaleString()}
              </TableCell>
              <TableCell>
                <Badge className={statusColors[quotation.status]}>
                  {quotation.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(quotation.createdAt, 'dd MMM yyyy')}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onView(quotation)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {onEdit && quotation.status === 'draft' && (
                    <Button variant="ghost" size="icon" onClick={() => onEdit(quotation)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => onGeneratePDF(quotation)}>
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
