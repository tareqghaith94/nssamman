

## Collections Page: Unified Total + Client Name Column

### Changes to `src/pages/Collections.tsx`

**1. Single Total Outstanding (converted to USD)**
- Import `useExchangeRates` hook
- Replace the `totalsByCurrency` logic (lines 109-119) with a single accumulator that converts each shipment's outstanding amount to USD using `convert(outstanding, shipmentCurrency, 'USD')`
- Display one value: e.g., `$7,100.00`
- Add a small "(converted)" label if mixed currencies are present, so users know FX conversion was applied

**2. Add Client Name column to the table**
- Add a "Client" column header after "Reference ID"
- Display `shipment.clientName` in each row (or a dash if empty)
- Update the empty-state `colSpan` from 5 to 6

### Column layout after changes

| Reference ID | Client | Salesperson | Due Date | Amount | Actions |

No database changes needed. Single file edit.

