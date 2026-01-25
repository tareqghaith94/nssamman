

## Goal
Fix the Database page to show the correct currency (e.g., JOD) for Selling, Cost, and Profit columns when pricing was done in that currency.

## Problem Analysis

The issue is that the shipment's `currency` field is never updated during pricing:

1. **Lead Creation** (`LeadForm.tsx` line 143): Currency is hardcoded to `'USD'`
2. **Pricing Save** (`PricingForm.tsx` lines 382-391): Updates totals but **never updates the `currency` field**
3. **Database Display** (`Database.tsx`): Correctly uses `shipment.currency`, but it's still USD

Your data confirms this:
- All shipments have `currency: USD` in the database
- Even shipments priced in JOD show USD because the pricing form never saved the currency change

## Solution

### File: `src/components/forms/PricingForm.tsx`

Update the `updateShipment` call to include the `currency` field:

**Current code (lines 382-391):**
```typescript
await updateShipment(shipment.id, {
  agent,
  pricingOwner: (pricingOwner as 'Uma' | 'Rania' | 'Mozayan') || undefined,
  costPerUnit: costLineItems[0]?.unitCost || 0,
  sellingPricePerUnit: lineItems[0]?.unitCost || 0,
  profitPerUnit: (lineItems[0]?.unitCost || 0) - (costLineItems[0]?.unitCost || 0),
  totalSellingPrice: grandTotal,
  totalCost,
  totalProfit,
});
```

**Updated code:**
```typescript
await updateShipment(shipment.id, {
  agent,
  pricingOwner: (pricingOwner as 'Uma' | 'Rania' | 'Mozayan') || undefined,
  costPerUnit: costLineItems[0]?.unitCost || 0,
  sellingPricePerUnit: lineItems[0]?.unitCost || 0,
  profitPerUnit: (lineItems[0]?.unitCost || 0) - (costLineItems[0]?.unitCost || 0),
  totalSellingPrice: grandTotal,
  totalCost,
  totalProfit,
  currency: quotationCurrency,  // Save the pricing currency to shipment
});
```

## Will This Fix Existing Entries?

**For new entries**: Yes, they will be saved with the correct currency going forward.

**For existing entries**: No, the existing database records still have `currency: 'USD'`. There are two options:

1. **Option A (Recommended)**: Run a one-time data fix to update the currency for affected shipments
2. **Option B**: Re-open and re-save each affected shipment in the Pricing form

### Data Fix Query (Option A)
If you want to fix existing shipments where pricing was done in JOD but currency shows USD, I can prepare a migration to update them. I would need to identify which shipments should be JOD based on their quotation currency.

## Result

After this fix:
- New pricing saves will correctly set the shipment's `currency` field
- Database page will show "JOD 2,422.50" instead of "$2,422.50" for JOD-priced shipments
- All displays (Selling, Cost, Profit, Invoice Amount) will use their correct currencies

