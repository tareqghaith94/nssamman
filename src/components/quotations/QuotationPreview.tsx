import { Quotation } from '@/types/quotation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Download, Send } from 'lucide-react';
import { useQuotations } from '@/hooks/useQuotations';
import { toast } from 'sonner';
import nssLogo from '@/assets/nss-logo.png';

interface QuotationPreviewProps {
  quotation: Quotation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TERMS_AND_CONDITIONS = [
  'Above rates include FAF, ERS, ISP, BUC, PSS',
  'Subject to changes in duration',
  'Subject to equipment & space availability',
  'Subject to Local charges',
  'Subject to THC, THD and other charges',
  'For General Commodity "Non-Hazardous"',
  'Subject to port agent acceptance',
  'Subject to vessel captain acceptance',
  'Transit times may change without notice',
  'HCS standards for MED TRADE',
];

export function QuotationPreview({ quotation, open, onOpenChange }: QuotationPreviewProps) {
  const { issueQuotation } = useQuotations();

  if (!quotation) return null;

  const getTotalUnits = () => {
    return quotation.equipment.reduce((sum, eq) => sum + eq.quantity, 0);
  };

  const oceanTotal = (quotation.oceanFreightAmount || 0) * getTotalUnits();
  const exwTotal = (quotation.exwAmount || 0) * (quotation.exwQty || 0);
  const grandTotal = oceanTotal + exwTotal;

  const handleIssue = async () => {
    try {
      await issueQuotation(quotation.id);
      toast.success('Quotation issued successfully');
    } catch (error) {
      toast.error('Failed to issue quotation');
    }
  };

  const handleDownloadPDF = () => {
    // For now, use print functionality
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto print:max-w-none print:h-auto">
        <DialogHeader className="print:hidden">
          <DialogTitle>Quotation Preview</DialogTitle>
        </DialogHeader>

        <div className="bg-background p-6 space-y-6 print:p-0">
          {/* Header */}
          <div className="flex items-start justify-between border-b pb-4">
            <div className="flex items-center gap-4">
              <img src={nssLogo} alt="NSS" className="h-16 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-foreground">National Shipping Services</h1>
                <p className="text-sm text-muted-foreground">
                  Dubai, United Arab Emirates
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{quotation.quoteNumber}</p>
              <p className="text-sm text-muted-foreground">
                Date: {format(quotation.createdAt, 'dd MMM yyyy')}
              </p>
              {quotation.validUntil && (
                <p className="text-sm text-muted-foreground">
                  Valid Until: {format(quotation.validUntil, 'dd MMM yyyy')}
                </p>
              )}
            </div>
          </div>

          {/* Client Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">To</h3>
              <p className="font-medium">{quotation.clientName}</p>
              {quotation.clientAddress && (
                <p className="text-sm text-muted-foreground whitespace-pre-line">{quotation.clientAddress}</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Route Details</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">POL:</span> {quotation.pol}</p>
                <p><span className="text-muted-foreground">POD:</span> {quotation.pod}</p>
                <p><span className="text-muted-foreground">Mode:</span> {quotation.modeOfTransport}</p>
              </div>
            </div>
          </div>

          {/* Equipment & Pricing Table */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Pricing Details</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-2 px-3 text-sm font-medium">Description</th>
                  <th className="text-left py-2 px-3 text-sm font-medium">Equipment</th>
                  <th className="text-right py-2 px-3 text-sm font-medium">Rate</th>
                  <th className="text-right py-2 px-3 text-sm font-medium">Qty</th>
                  <th className="text-right py-2 px-3 text-sm font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {quotation.oceanFreightAmount && quotation.equipment.map((eq, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2 px-3">Ocean Freight</td>
                    <td className="py-2 px-3">{eq.type}</td>
                    <td className="py-2 px-3 text-right">${quotation.oceanFreightAmount?.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">{eq.quantity}</td>
                    <td className="py-2 px-3 text-right font-medium">
                      ${((quotation.oceanFreightAmount || 0) * eq.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {quotation.exwAmount && quotation.exwQty && (
                  <tr className="border-b">
                    <td className="py-2 px-3">Ex-Works / Pickup</td>
                    <td className="py-2 px-3">-</td>
                    <td className="py-2 px-3 text-right">${quotation.exwAmount.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">{quotation.exwQty}</td>
                    <td className="py-2 px-3 text-right font-medium">
                      ${exwTotal.toLocaleString()}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50">
                  <td colSpan={4} className="py-2 px-3 text-right font-semibold">Total:</td>
                  <td className="py-2 px-3 text-right font-bold text-lg">${grandTotal.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Remarks */}
          {quotation.remarks && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Remarks</h3>
              <p className="text-sm whitespace-pre-line bg-muted/30 p-3 rounded-md">{quotation.remarks}</p>
            </div>
          )}

          {/* Terms & Conditions */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Terms & Conditions</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              {TERMS_AND_CONDITIONS.map((term, idx) => (
                <li key={idx}>• {term}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t print:hidden">
          {quotation.status === 'draft' && (
            <Button onClick={handleIssue} variant="default">
              <Send className="h-4 w-4 mr-2" />
              Issue Quote
            </Button>
          )}
          <Button onClick={handleDownloadPDF} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
