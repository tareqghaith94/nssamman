
## Telesales Module — Same System

Add a full telesales tracking module within the current app, including a contacts database, call logging, follow-up scheduling, CSV import, one-click conversion to Leads, and a performance dashboard.

---

### 1. Database Tables

**`telesales_contacts`** — the informal database of people to call
- `id`, `created_at`, `created_by` (user who added/imported)
- `company_name`, `contact_name`, `phone`, `email`, `industry`, `source` (which informal DB they came from)
- `status`: new, in_progress, converted, not_interested, do_not_call
- `next_follow_up`: date for the next scheduled callback
- `assigned_to`: the telesales employee (links to salesperson name)
- `notes`: general notes about the contact
- `converted_shipment_id`: links to the Lead created on conversion (nullable)
- RLS: all authenticated users can view; only assigned user or admin can edit

**`telesales_calls`** — log of every call made
- `id`, `contact_id` (FK to telesales_contacts), `called_by` (user_id)
- `call_date`: timestamp
- `outcome`: interested, not_interested, callback, no_answer, wrong_number, voicemail
- `duration_minutes`: optional, rough estimate
- `notes`: what was discussed
- `follow_up_date`: when to call back (if applicable)
- RLS: all authenticated users can view; creator can edit

---

### 2. New Pages and Navigation

**Page: `/telesales`** — Main telesales workspace
- Tab 1: **Contacts** — filterable table of all contacts with status badges, next follow-up date, and call count
- Tab 2: **Today's Calls** — contacts with follow-up date = today, plus any "new" contacts not yet called
- Tab 3: **Performance** — KPI cards and charts

**Sidebar**: Add "Telesales" under the "Pipeline" section group (after Leads)

---

### 3. Contact Management

- **Add Contact** dialog: manual entry form for name, company, phone, email, industry, source, notes
- **CSV Import** dialog: upload CSV/Excel file, map columns, preview rows, then bulk insert into `telesales_contacts`
  - Parse CSV client-side using built-in browser APIs
  - Show a preview table of the first 10 rows before confirming import
  - Validate required fields (at minimum: contact_name or company_name, and phone)
- **Contact Detail** slide-out panel: shows contact info, full call history, and action buttons (Log Call, Convert to Lead)

---

### 4. Call Logging

- **Log Call** dialog (accessible from contact row or detail panel):
  - Pre-filled contact info
  - Outcome dropdown: Interested / Not Interested / Callback / No Answer / Wrong Number / Voicemail
  - Notes textarea
  - Follow-up date picker (auto-shown when outcome is "Callback" or "Interested")
  - On save: inserts into `telesales_calls`, updates `telesales_contacts.status` and `next_follow_up`

---

### 5. Convert to Lead (One-Click)

- Button on each contact row (visible when status is "interested")
- On click:
  1. Opens a pre-filled Lead creation form with client_name = company_name, salesperson = telesales employee's name
  2. User fills in port of loading/discharge, equipment, etc. (standard Lead fields)
  3. On submit: creates the Lead via existing `createShipment`, then updates `telesales_contacts.status` to "converted" and stores `converted_shipment_id`
- The telesales employee is auto-assigned as salesperson since she has a ref_prefix

---

### 6. Performance Dashboard (Tab 3)

KPI cards:
- **Calls Today / This Week**: count of `telesales_calls` records
- **Conversion Rate**: contacts with status "converted" / total contacts contacted
- **Follow-up Compliance**: percentage of contacts where follow-up was done on or before the scheduled date

Charts (using existing recharts):
- Calls per day (bar chart, last 14 days)
- Outcome distribution (pie chart)
- Conversion funnel: New -> In Progress -> Interested -> Converted

---

### 7. User Setup

- Add the new telesales employee to the salesperson roster in `SALESPERSON_REF_PREFIX` (need her name and desired prefix letter)
- Create her user account via User Management with the `sales` role
- She will see the full system but primarily work from the Telesales page

---

### Files to Create
- `src/pages/Telesales.tsx` — main page with tabs
- `src/components/telesales/ContactsTable.tsx` — filterable contacts table
- `src/components/telesales/LogCallDialog.tsx` — call logging form
- `src/components/telesales/AddContactDialog.tsx` — manual contact entry
- `src/components/telesales/ImportContactsDialog.tsx` — CSV import with preview
- `src/components/telesales/ContactDetailPanel.tsx` — slide-out with call history
- `src/components/telesales/ConvertToLeadDialog.tsx` — pre-filled lead creation
- `src/components/telesales/TelesalesKPIs.tsx` — performance dashboard
- `src/hooks/useTelesalesContacts.ts` — CRUD hooks for contacts
- `src/hooks/useTelesalesCalls.ts` — CRUD hooks for calls

### Files to Modify
- `src/App.tsx` — add `/telesales` route
- `src/components/layout/Sidebar.tsx` — add Telesales nav item under Pipeline
- `src/types/permissions.ts` — add `/telesales` to ALL_PAGES
- `src/components/layout/CommandSearch.tsx` — include telesales contacts in global search

### Database Migration
- Create `telesales_contacts` table with RLS
- Create `telesales_calls` table with RLS
- Enable realtime on both tables for live updates
