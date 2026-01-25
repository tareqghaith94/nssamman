
## Goal
Fix the Database page to accurately display selling prices and cost prices in their **correct separate currencies**.

## Problem Analysis

The current data model has a fundamental limitation:

| Field | Purpose | Current State |
|-------|---------|---------------|
| `shipments.currency` | Used for selling/cost/profit display | Single value (e.g., JOD) |
| `quotations.currency` | Quotation document currency | JOD |
| `cost_line_items.currency` | Per-line cost currency | EUR, USD, JOD (mixed) |

**Example from your data:**
- Reference `T-2601-0001`: Quotation is USD, but cost line items are in EUR
- The Database page uses `shipments.currency` for both Selling AND Cost columns

**Current behavior:** Both columns show the same currency (JOD) even when costs are in EUR.

---

## Solution: Add Separate Cost Currency Field

### Database Change
Add a `cost_currency` column to the `shipments` table to store the primary currency used for costs:

```sql
ALTER TABLE shipments ADD COLUMN cost_currency TEXT DEFAULT 'USD';
```

### Code Changes

**1. `src/types/shipment.ts`** - Add type definition:
```typescript
costCurrency?: Currency;
```

**2. `src/hooks/useShipments.ts`** - Map the new field:
```typescript
// In shipmentToRow
cost_currency: s.costCurrency || 'USD',

// In rowToShipment  
costCurrency: row.cost_currency as Currency,
```

**3. `src/components/forms/PricingForm.tsx`** - Save cost currency during pricing:
```typescript
// Determine the primary cost currency from cost line items
const primaryCostCurrency = costLineItems[0]?.currency || 'USD';

await updateShipment(shipment.id, {
  // ...existing fields
  currency: quotationCurrency,       // For selling prices
  costCurrency: primaryCostCurrency, // For cost prices
});
```

**4. `src/pages/Database.tsx`** - Display with correct currencies:
```typescript
// Selling column - use shipment.currency (quotation currency)
{formatCurrencyValue(shipment.totalSellingPrice, shipment.currency)}

// Cost column - use shipment.costCurrency (cost currency)
{formatCurrencyValue(shipment.totalCost, shipment.costCurrency || shipment.currency)}
```

---

## Data Migration for Existing Records

Run a one-time update to set `cost_currency` from the first cost line item of each shipment:

```sql
UPDATE shipments s
SET cost_currency = (
  SELECT c.currency 
  FROM cost_line_items c 
  WHERE c.shipment_id = s.id 
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM cost_line_items c WHERE c.shipment_id = s.id
);
```

---

## Result After Fix

| Column | Currency Source | Example |
|--------|-----------------|---------|
| Selling | `shipment.currency` | JOD 2,422.50 |
| Cost | `shipment.costCurrency` | EUR 1,800.00 |
| Profit | `shipment.currency` | JOD 622.50 |
| Invoice Amount | `shipment.invoiceCurrency` | JOD 2,422.50 |

---

## Files to Modify

1. **Database migration** - Add `cost_currency` column
2. **`src/types/shipment.ts`** - Add `costCurrency` type
3. **`src/hooks/useShipments.ts`** - Map `cost_currency` field
4. **`src/components/forms/PricingForm.tsx`** - Save cost currency
5. **`src/pages/Database.tsx`** - Display cost with `costCurrency`

---

## Important Note on Profit Display

Since selling and cost are in different currencies, the profit calculation and display becomes more complex. Options:
- **Keep profit in selling currency** (current approach, but mathematically incorrect for mixed currencies)
- **Convert costs to selling currency** using exchange rates before calculating profit
- **Show profit with a note** that it's approximate when currencies differ

Would you like me to implement exchange-rate-based profit calculation, or keep profit displayed in the selling currency with the understanding that it's nominal when currencies differ?
