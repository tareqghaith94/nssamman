import { Shipment } from "@/types/shipment";

function formatEquipment(equipment: Shipment['equipment']): string {
  if (!equipment || equipment.length === 0) return '';
  return equipment.map(e => `${e.type} x ${e.quantity}`).join(', ');
}

function formatDateValue(dateVal: Date | string | null | undefined): string {
  if (!dateVal) return '';
  try {
    const date = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

function formatBoolean(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  return value ? 'Yes' : 'No';
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return value.toString();
}

function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export function exportShipmentsToCSV(shipments: Shipment[], filename: string): void {
  const headers = [
    'Reference ID',
    'Salesperson',
    'Client',
    'Port of Loading',
    'Port of Discharge',
    'Equipment',
    'Mode of Transport',
    'Incoterm',
    'Payment Terms',
    'Stage',
    'Agent',
    'Selling Price/Unit',
    'Cost/Unit',
    'Profit/Unit',
    'Total Selling Price',
    'Total Cost',
    'Total Profit',
    'NSS Booking Reference',
    'NSS Invoice Number',
    'Total Invoice Amount',
    'BL Type',
    'BL Draft Approval',
    'Final BL Issued',
    'Terminal Cutoff',
    'Gate In Terminal',
    'ETD',
    'ETA',
    'Arrival Notice Sent',
    'DO Issued',
    'DO Release Date',
    'Ops Owner',
    'Payment Collected',
    'Payment Collected Date',
    'Agent Invoice Uploaded',
    'Agent Invoice Amount',
    'Agent Invoice Date',
    'Agent Paid',
    'Agent Paid Date',
    'Is Lost',
    'Lost Reason',
    'Lost At',
    'Created At',
    'Completed At'
  ];

  const rows = shipments.map(s => [
    s.referenceId || '',
    s.salesperson || '',
    s.clientName || '',
    s.portOfLoading || '',
    s.portOfDischarge || '',
    formatEquipment(s.equipment),
    s.modeOfTransport || '',
    s.incoterm || '',
    s.paymentTerms || '',
    s.stage || '',
    s.agent || '',
    formatCurrency(s.sellingPricePerUnit),
    formatCurrency(s.costPerUnit),
    formatCurrency(s.profitPerUnit),
    formatCurrency(s.totalSellingPrice),
    formatCurrency(s.totalCost),
    formatCurrency(s.totalProfit),
    s.nssBookingReference || '',
    s.nssInvoiceNumber || '',
    formatCurrency(s.totalInvoiceAmount),
    s.blType || '',
    formatBoolean(s.blDraftApproval),
    formatBoolean(s.finalBLIssued),
    formatDateValue(s.terminalCutoff),
    formatDateValue(s.gateInTerminal),
    formatDateValue(s.etd),
    formatDateValue(s.eta),
    formatBoolean(s.arrivalNoticeSent),
    formatBoolean(s.doIssued),
    formatDateValue(s.doReleaseDate),
    s.opsOwner || '',
    formatBoolean(s.paymentCollected),
    formatDateValue(s.paymentCollectedDate),
    formatBoolean(s.agentInvoiceUploaded),
    formatCurrency(s.agentInvoiceAmount),
    formatDateValue(s.agentInvoiceDate),
    formatBoolean(s.agentPaid),
    formatDateValue(s.agentPaidDate),
    formatBoolean(s.isLost),
    s.lostReason || '',
    formatDateValue(s.lostAt),
    formatDateValue(s.createdAt),
    formatDateValue(s.completedAt)
  ]);

  const csvContent = [
    headers.map(escapeCSVField).join(','),
    ...rows.map(row => row.map(escapeCSVField).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateExportFilename(prefix: string = 'shipments-export'): string {
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}-${date}.csv`;
}
