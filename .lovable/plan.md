

## Goal
Fix the Database page so invoice amounts display in their correct invoice currency (e.g., JOD) instead of the pricing currency (e.g., USD).

## Changes Required

### File: `src/pages/Database.tsx`

**Change 1: Line 376 - Invoice Amount**
Update to use `invoiceCurrency` instead of `currency`:
```typescript
// Before
<DetailItem label="Invoice Amount" value={formatCurrencyValue(shipment.totalInvoiceAmount, shipment.currency)} />

// After
<DetailItem label="Invoice Amount" value={formatCurrencyValue(shipment.totalInvoiceAmount, shipment.invoiceCurrency)} />
```

**Change 2: Line 414 - Agent Invoice Amount**
Update to use `invoiceCurrency` instead of `currency`:
```typescript
// Before
<DetailItem label="Agent Invoice Amount" value={formatCurrencyValue(shipment.agentInvoiceAmount, shipment.currency)} />

// After
<DetailItem label="Agent Invoice Amount" value={formatCurrencyValue(shipment.agentInvoiceAmount, shipment.invoiceCurrency)} />
```

## Result
- All existing entries will immediately display correctly
- Invoice Amount will show "JOD 2,422.50" instead of "$2,422.50" for JOD invoices
- Pricing fields (Selling, Cost, Profit) remain in the pricing currency as expected

## No Database Changes Required
The data is already stored correctly - this is purely a UI display fix.

