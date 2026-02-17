

## Payables and Collections UI Cleanup

### Goal
Reduce visual clutter on both pages to make them scannable and practical for daily use. This is a **frontend-only change** -- no database modifications, no data loss.

---

### Payables Page Changes

**1. Collapse rows by default**
- Change default `isOpen` state to `false` regardless of payable count

**2. Remove the "Route" column from the main table**
- Route info is secondary context; removing it saves horizontal space

**3. Combine "Estimated" and "Invoice" into a single "Amount" column**
- Show invoice amount with a checkmark icon if invoiced, otherwise show estimated amount in muted style
- Example: "EUR 1,800" (green check) or "~EUR 1,800" (estimate)

**4. Move actions into a dropdown menu**
- Replace inline Edit / Pay / Delete buttons with a single "..." dropdown
- Menu items: Edit, Mark as Paid, View Invoice, Delete

**5. Add a search/filter bar**
- Text input above the table to filter by Reference ID or Client name

---

### Collections Page Changes

**1. Remove the "Route" column**

**2. Merge "Status" into the "Due Date" column**
- Show date with a small colored status label underneath (e.g., red "Overdue")

**3. Merge "Progress" into the "Amount" column**
- Display as "JOD 500 / 2,000 (25%)" with a thin inline progress bar

**4. Move actions into a dropdown menu**
- Replace Record / Mark Full / Undo buttons with a "..." dropdown

**5. Add a search/filter bar**
- Text filter for Reference ID, Client, or Salesperson

---

### Column Changes Summary

**Payables: 7 columns reduced to 5**

| Before | After |
|--------|-------|
| Expand toggle | Expand toggle |
| Reference ID | Reference ID |
| Client | Client |
| Route | _(removed)_ |
| Parties | Parties |
| Outstanding | Amount (combined) |
| Actions | Actions (dropdown) |

**Collections: 8 columns reduced to 5**

| Before | After |
|--------|-------|
| Reference ID | Reference ID |
| Salesperson | Salesperson |
| Route | _(removed)_ |
| Due Date | Due Date + Status |
| Status | _(merged)_ |
| Progress | _(merged)_ |
| Amount | Amount + Progress |
| Actions | Actions (dropdown) |

---

### Technical Details

**Files to modify:**

1. `src/components/payables/PayableShipmentRow.tsx`
   - Default `isOpen` to `false`
   - Remove Route from parent row
   - Combine estimated/invoice into one "Amount" column in child rows
   - Replace inline buttons with DropdownMenu

2. `src/pages/Payables.tsx`
   - Remove Route TableHead
   - Add search input with filtering logic
   - Update colSpan values

3. `src/pages/Collections.tsx`
   - Remove Route and Status columns
   - Merge progress bar into Amount column
   - Replace action buttons with DropdownMenu
   - Add search input with filtering logic

**No new dependencies needed** -- DropdownMenu is already available via Radix.
**No database changes** -- purely visual/layout modifications.

