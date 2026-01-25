

## Goal
Consolidate the two separate edit dialogs (EditPayableDialog + PayableInvoiceDialog) into a single unified dialog that allows users to edit all payable details and upload invoices in one place.

## Current State
The payables interface has two edit buttons for each payable entry:
- **Pencil icon** → Opens EditPayableDialog (party type, name, amount, currency, due date, notes)
- **Upload Invoice button** → Opens PayableInvoiceDialog (file upload, invoice amount)

This is confusing because users have to choose between two similar-looking edit options.

## Proposed Solution
Merge both dialogs into a **single "Edit Payable" dialog** that includes all fields:
- Party type, name
- Estimated amount, currency
- Due date with auto-calculation
- Notes
- **Invoice section** (file upload + invoice amount)

## Implementation Steps

### 1. Enhance EditPayableDialog
Modify `src/components/payables/EditPayableDialog.tsx` to include invoice upload functionality:
- Add file upload input (from PayableInvoiceDialog)
- Add invoice amount field
- Show existing invoice if one is uploaded (with ability to replace)
- Display difference between estimated and invoice amounts

### 2. Update EditPayableDialog Props and Submit Handler
Extend the onSubmit callback to include invoice data:
```typescript
onSubmit: (data: {
  id: string;
  partyType: PartyType;
  partyName: string;
  estimatedAmount: number | null;
  currency: string;
  notes: string | null;
  dueDate: string | null;
  // New invoice fields
  invoiceAmount?: number;
  invoiceFileName?: string;
  invoiceFilePath?: string;
  invoiceUploaded?: boolean;
  invoiceDate?: string;
}) => void;
```

### 3. Update PayableShipmentRow
- Remove the separate "Upload Invoice" button
- Keep only the pencil (edit) button, rename to "Edit"
- Update the onEditPayable handler to use the unified dialog

### 4. Update useShipmentPayables Hook
Modify the `editPayable` mutation to handle both regular edits and invoice uploads in a single call.

### 5. Update Payables Page
- Remove the separate `invoiceDialogOpen` state and `PayableInvoiceDialog` component usage
- Simplify to just one dialog state

### 6. Clean Up PayableInvoiceDialog
After migration, the `PayableInvoiceDialog` component can be removed or deprecated.

## Technical Details

### Enhanced EditPayableDialog Layout
```
┌─────────────────────────────────────┐
│ Edit Payable                        │
├─────────────────────────────────────┤
│ Party Type:     [Dropdown]          │
│ Party Name:     [Input]             │
├─────────────────────────────────────┤
│ Estimated Amount: [Input] Currency: │
│ Due Date:       [Calendar]          │
│ Notes:          [Textarea]          │
├─────────────────────────────────────┤
│ ─── Invoice Details ───             │
│ Invoice File:   [Upload Button]     │
│ Invoice Amount: [Input]             │
│ (±X from estimate)                  │
├─────────────────────────────────────┤
│           [Cancel] [Save]           │
└─────────────────────────────────────┘
```

### Conditional Invoice Section
- Show invoice section expanded if payable already has an invoice
- Otherwise show as collapsible or clearly separated section
- Invoice upload is optional - users can save just the basic details

## Files to Modify
1. **src/components/payables/EditPayableDialog.tsx** - Add invoice upload functionality
2. **src/components/payables/PayableShipmentRow.tsx** - Remove separate invoice button
3. **src/hooks/useShipmentPayables.ts** - Ensure editPayable handles invoice data
4. **src/pages/Payables.tsx** - Remove PayableInvoiceDialog usage

## Benefits
- Single entry point for all payable edits
- Clearer, less confusing UI
- Fewer dialogs to manage
- Better user flow - edit everything in one place

