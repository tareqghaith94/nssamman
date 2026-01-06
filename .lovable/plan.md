# Plan: Cost Breakdown for Pricing Form

## Overview
Currently, internal pricing uses a single `costPerUnit` field. This plan adds a detailed cost breakdown structure that mirrors the quotation line items, allowing different costs per equipment type and additional cost items (local charges, documentation fees, etc.).

---

## Database Changes

### New Table: `cost_line_items`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `shipment_id` | uuid | FK to shipments |
| `description` | text | Cost description (e.g., "Ocean Freight", "Local Charges") |
| `equipment_type` | text | Nullable - links to equipment type |
| `unit_cost` | numeric | Cost per unit |
| `quantity` | integer | Number of units |
| `amount` | numeric | Computed: unit_cost x quantity |
| `created_at` | timestamptz | Creation timestamp |

### Update `shipments` Table
- Keep existing `costPerUnit` as a legacy/summary field
- The new `totalCost` field will be calculated from cost line items

---

## UI Changes

### PricingForm Updates

**Replace single Cost/Unit input with a Cost Breakdown section:**

```
INTERNAL COST BREAKDOWN
┌─────────────────┬──────────────┬───────────┬─────┬───────────┬───┐
│ Description     │ Type         │ Cost ($)  │ Qty │ Amount    │   │
├─────────────────┼──────────────┼───────────┼─────┼───────────┼───┤
│ Ocean Freight   │ 40HC         │ 1,800     │ 2   │ $3,600    │ x │
│ Ocean Freight   │ 20ft         │ 1,200     │ 1   │ $1,200    │ x │
│ Local Charges   │ Per BL       │ 150       │ 1   │ $150      │ x │
│ Documentation   │ Per BL       │ 75        │ 1   │ $75       │ x │
└─────────────────┴──────────────┴───────────┴─────┴───────────┴───┘
                                        [+ Add cost line]
                                              Total Cost: $5,025
```

**Agent field remains as-is.**

### Updated Profit Calculation

```
Total Selling (from quote lines): $7,500
Total Cost (from cost lines):     $5,025
─────────────────────────────────────────
Gross Profit:                     $2,475 (33% margin)
```

---

## Data Flow

### When Opening Form:
1. Load existing cost line items from `cost_line_items` table
2. If none exist, initialize from shipment equipment with default costs

### When Saving:
1. Delete existing cost line items for this shipment
2. Insert new cost line items
3. Update shipment with calculated `totalCost` and `totalProfit`

---

## Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| **Create** | `src/hooks/useCostLineItems.ts` | Hook for cost line items CRUD |
| **Modify** | `src/components/forms/PricingForm.tsx` | Replace cost input with cost breakdown |
| **Modify** | `src/types/shipment.ts` | Add `CostLineItem` interface |
| **Migration** | Create `cost_line_items` table | Store cost breakdown |

---

## PricingForm Structure After Changes

```
┌────────────────────────────────────────────────────────────────────┐
│ Pricing & Quote for NSS-001                                        │
├────────────────────────────────────────────────────────────────────┤
│ Route: Jeddah → Aqaba    Client: ABC Corp                          │
│ Equipment: 40HC × 2, 20ft × 1    Salesperson: Tareq                │
├────────────────────────────────────────────────────────────────────┤
│ INTERNAL PRICING                                                   │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Agent: [________________]                                    │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ COST BREAKDOWN                                            [+ Add]  │
│ ┌─────────────┬─────────┬─────────┬─────┬──────────┬───┐          │
│ │ Description │ Type    │ Cost    │ Qty │ Amount   │   │          │
│ ├─────────────┼─────────┼─────────┼─────┼──────────┼───┤          │
│ │ Ocean Frt   │ 40HC    │ 1,800   │ 2   │ $3,600   │ x │          │
│ │ Ocean Frt   │ 20ft    │ 1,200   │ 1   │ $1,200   │ x │          │
│ │ Local Chrg  │ Per BL  │ 150     │ 1   │ $150     │ x │          │
│ └─────────────┴─────────┴─────────┴─────┴──────────┴───┘          │
│                                         Total Cost: $4,950         │
├────────────────────────────────────────────────────────────────────┤
│ CLIENT QUOTATION                                          [+ Add]  │
│ ┌─────────────┬─────────┬─────────┬─────┬──────────┬───┐          │
│ │ Description │ Type    │ Rate    │ Qty │ Amount   │   │          │
│ ├─────────────┼─────────┼─────────┼─────┼──────────┼───┤          │
│ │ Ocean Frt   │ 40HC    │ 2,500   │ 2   │ $5,000   │ x │          │
│ │ Ocean Frt   │ 20ft    │ 1,800   │ 1   │ $1,800   │ x │          │
│ │ Doc Fee    │ Per BL  │ 200     │ 1   │ $200     │ x │          │
│ └─────────────┴─────────┴─────────┴─────┴──────────┴───┘          │
│                                        Total Selling: $7,000       │
├────────────────────────────────────────────────────────────────────┤
│ SUMMARY                                                            │
│ Total Selling:  $7,000                                             │
│ Total Cost:     $4,950                                             │
│ Gross Profit:   $2,050 (29.3% margin)                              │
├────────────────────────────────────────────────────────────────────┤
│ Remarks: [_______________________________________________]         │
│ Validity: [30] days                                                │
├────────────────────────────────────────────────────────────────────┤
│                    [Cancel]  [Save Draft]  [Save & Issue]          │
└────────────────────────────────────────────────────────────────────┘
```

---

## RLS Policies for `cost_line_items`

- **SELECT**: Authenticated users can view all cost items
- **INSERT**: Authenticated users can create cost items
- **UPDATE**: Authenticated users can update cost items
- **DELETE**: Authenticated users can delete cost items

---

## Critical Files for Implementation

- `src/components/forms/PricingForm.tsx` - Main form to modify, add cost breakdown UI
- `src/hooks/useCostLineItems.ts` - New hook for cost line items CRUD operations
- `src/types/shipment.ts` - Add CostLineItem interface
- `src/hooks/useQuotations.ts` - Reference pattern for line items implementation
- `supabase/migrations/` - New migration for cost_line_items table
