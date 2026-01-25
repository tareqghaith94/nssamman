

## Goal
Ensure users can reliably change currency and due dates when editing payables, and that changes are properly saved.

## Current State Analysis
After reviewing the code, the `EditPayableDialog` component **already includes** both currency and due date editing functionality:

- **Currency**: Dropdown with USD, EUR, JOD options
- **Due Date**: Calendar picker with auto-calculation based on ETD+3 (exports) or ETA-10 (imports), plus "Reset to auto" button

The `editPayable` mutation in `useShipmentPayables.ts` also already handles saving both fields:
```typescript
currency: data.currency,
due_date: data.dueDate,
```

## Identified Issue
There's a subtle bug in the due date logic (line 93 of `EditPayableDialog.tsx`):

```typescript
dueDate: useCustomDueDate && dueDate ? dueDate.toISOString() : null,
```

This only saves the due date if `useCustomDueDate` is true. The problem:
1. If a payable has an **auto-calculated** due date (stored as `null` in DB), opening the dialog shows the calculated date
2. The `useCustomDueDate` flag is `false` in this case
3. If the user changes **only the currency** (not the date), the date gets saved as `null` even though a date is displayed
4. The expected behavior: if a date is visible and unchanged, preserve that behavior

## Solution

### Fix 1: Improve due date save logic
Update the `handleSubmit` function to save the displayed due date when a date is visible, not just when it's "custom":

```typescript
dueDate: dueDate ? dueDate.toISOString() : null,
```

This ensures that whatever date is displayed (whether auto-calculated or custom) gets saved if a date is shown.

### Fix 2: Mark auto-populated dates as custom when saved
Alternatively, if we want to distinguish between "truly custom" and "auto-calculated but visible":
- Keep the current logic but change the UX label to clarify
- When saving, always save the displayed date if one exists

### Fix 3: Improve initialization for existing payables with stored due dates
Ensure that when a payable already has a `due_date` stored, it's correctly loaded and marked as custom.

## Implementation Changes

### File: `src/components/payables/EditPayableDialog.tsx`

1. **Update `handleSubmit`** to always save the visible due date:
   - Change from: `dueDate: useCustomDueDate && dueDate ? dueDate.toISOString() : null`
   - Change to: `dueDate: dueDate ? dueDate.toISOString() : null`

2. This ensures:
   - If user edits currency only, the displayed due date is preserved
   - If user clears the date explicitly, it saves as null
   - No confusing behavior where visible dates disappear on save

## Technical Details

The database column `shipment_payables.due_date` accepts null values, and the UI already correctly shows "auto" vs "custom" labels. The only change needed is ensuring the save logic matches what the user sees in the dialog.

### Testing Checklist
- Edit a payable and change only the currency - due date should remain unchanged
- Edit a payable and select a custom due date - new date should save
- Edit a payable and use "Reset to auto" - calculated date should save
- Create a new payable with auto-calculated due date - date should save correctly

