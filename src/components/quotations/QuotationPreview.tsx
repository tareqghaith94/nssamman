import { Quotation } from '@/types/quotation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Download, Send, X } from 'lucide-react';
import { useQuotations } from '@/hooks/useQuotations';
import { toast } from 'sonner';
import nssLogo from '@/assets/nss-logo.png';

interface QuotationPreviewProps {
  quotation: Quotation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center justify-between">
            <span>Quotation Preview</span>
            <div className="flex gap-2">
              {quotation.status === 'draft' && (
                <Button size="sm" onClick={handleIssue}>
                  <Send className="h-4 w-4 mr-2" />
                  Issue Quote
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Printable Content - Matches Your Excel Template */}
        <div className="bg-white text-black p-8 print:p-0" id="quotation-print">
          {/* Header with Logo and Company Info */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <img src={nssLogo} alt="NSS Logo" className="h-16 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-[#586784]">National Shipping Services</h1>
                <p className="text-sm text-gray-600">
                  11, Elia Abu Madi Street, Shmeisani, Amman, Jordan, 11194
                </p>
                <p className="text-sm text-gray-600">+962 (6) 5606909</p>
              </div>
            </div>
          </div>

          {/* Title - Centered */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#586784] border-b-2 border-[#586784] pb-2 inline-block">
              Freight Quotation
            </h2>
          </div>

          {/* Quote Number and Date Row */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase">Quote Number</p>
              <p className="text-lg font-bold">{quotation.quoteNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-600 uppercase">Quote Date</p>
              <p className="text-lg font-bold">
                {quotation.issuedAt 
                  ? format(quotation.issuedAt, 'dd MMM yyyy')
                  : format(quotation.createdAt, 'dd MMM yyyy')}
              </p>
            </div>
          </div>

          {/* Client Section */}
          <div className="mb-6 p-4 bg-gray-50 rounded">
            <p className="text-sm font-semibold text-gray-600 uppercase mb-2">Client Name</p>
            <p className="text-lg font-semibold">{quotation.clientName}</p>
            {quotation.clientAddress && (
              <p className="text-sm text-gray-600 mt-1">{quotation.clientAddress}</p>
            )}
            
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-600">POL:</span>{' '}
                <span>{quotation.pol}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-600">POD:</span>{' '}
                <span>{quotation.pod}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Mode:</span>{' '}
                <span className="capitalize">{quotation.modeOfTransport}</span>
              </div>
            </div>
          </div>

          {/* Pricing Table - Matches Your Excel Columns */}
          <div className="mb-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#586784] text-white">
                  <th className="border border-gray-300 p-3 text-left font-semibold">DESCRIPTION</th>
                  <th className="border border-gray-300 p-3 text-left font-semibold">Equipment Type</th>
                  <th className="border border-gray-300 p-3 text-right font-semibold">UNIT COST</th>
                  <th className="border border-gray-300 p-3 text-center font-semibold">QTY</th>
                  <th className="border border-gray-300 p-3 text-right font-semibold">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {/* Ocean Freight rows */}
                {quotation.equipment.map((eq, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-3">Ocean Freight</td>
                    <td className="border border-gray-300 p-3">{eq.type}</td>
                    <td className="border border-gray-300 p-3 text-right">
                      ${(quotation.oceanFreightAmount || 0).toLocaleString()}
                    </td>
                    <td className="border border-gray-300 p-3 text-center">{eq.quantity}</td>
                    <td className="border border-gray-300 p-3 text-right">
                      ${((quotation.oceanFreightAmount || 0) * eq.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
                
                {/* Ex-Works row if applicable */}
                {quotation.exwAmount && quotation.exwQty && (
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-3">Ex-Works</td>
                    <td className="border border-gray-300 p-3">-</td>
                    <td className="border border-gray-300 p-3 text-right">
                      ${quotation.exwAmount.toLocaleString()}
                    </td>
                    <td className="border border-gray-300 p-3 text-center">{quotation.exwQty}</td>
                    <td className="border border-gray-300 p-3 text-right">
                      ${exwTotal.toLocaleString()}
                    </td>
                  </tr>
                )}

                {/* Total Row */}
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={4} className="border border-gray-300 p-3 text-right">TOTAL</td>
                  <td className="border border-gray-300 p-3 text-right">
                    ${grandTotal.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Remarks */}
          {quotation.remarks && (
            <div className="mb-6">
              <p className="font-semibold text-gray-700 mb-2">Remarks:</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{quotation.remarks}</p>
            </div>
          )}

          {/* Validity */}
          {quotation.validUntil && (
            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm">
                <span className="font-semibold">Valid Until:</span>{' '}
                {format(quotation.validUntil, 'dd MMM yyyy')}
              </p>
            </div>
          )}

          {/* Terms and Conditions - Exact Wording from Your Template */}
          <div className="border-t pt-4">
            <p className="font-semibold text-gray-700 mb-3">Terms and Conditions:</p>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li>Above rates include (FAF, ERS, ISP, BUC, PSS)</li>
              <li>Above rates are subject to changes in duration if any.</li>
              <li>Above rates are subject to equipment &amp; space availability.</li>
              <li>Above rates are subject to Local charges.</li>
              <li>Above rates are subject to THC, THD and any other charges on both ends if any.</li>
              <li>Above rates for General Commodity &quot;Non-Hazardous&quot;.</li>
              <li>Above rates are subject to loading/transhipment/destination port agent acceptance.</li>
              <li>Above rates are subject to vessel&apos;s captain acceptance.</li>
              <li>Transit time, vessels routing and sailing/arrival dates might change with/without prior notice.</li>
              <li>HCS (Heavy Container Surcharges) standards for MED TRADE</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
