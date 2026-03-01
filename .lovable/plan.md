

## Import Telesales Databases from Excel Files

### What we have

1. **NSS Clients file** (4,704 records): Clean client list with company name, phone, mobile, email, address
2. **TradeAtlas files** (8 files, ~1,000+ records total): Export trade data with exporter names, addresses, products, and shipping ports — these are prospecting leads

### Approach: Upgrade CSV Import to Support Excel (XLSX)

Rather than a one-time script, upgrade the existing Import dialog to handle both CSV and XLSX files. This way the telesales employee can import future databases herself.

### Changes

**1. Add SheetJS library (`xlsx` package)**
- Lightweight client-side Excel parser
- Converts XLSX to the same row/header arrays the CSV parser already uses
- No backend changes needed

**2. Update `ImportContactsDialog.tsx`**
- Accept `.xlsx` and `.xls` files in addition to `.csv`
- When an Excel file is selected, use SheetJS to parse it into headers + rows
- Rest of the flow (column mapping, preview, import) stays the same
- Add a "source" tag option so she can label which database the contacts came from (e.g., "NSS Clients", "TradeAtlas")

**3. Smart column auto-mapping for these specific files**
- NSS file: "English Name" maps to `contact_name`, "Phone"/"Mobile" to `phone`, "Email" to `email`, "Address" to `notes`
- TradeAtlas files: "EXPORTER NAME" maps to `company_name`, "EXPORTER ADDRESS" to `notes`, "PRODUCT DETAILS" to `industry`, "PORT OF DEPARTURE" as additional context in notes
- The existing fuzzy-match logic will be improved to handle these column names

**4. Duplicate detection (optional but recommended)**
- Before importing, check if a contact with the same phone or company name already exists
- Show a count of "X new / Y duplicates" and let the user choose to skip duplicates

### Technical Details

**Files to modify:**
- `src/components/telesales/ImportContactsDialog.tsx` — add XLSX parsing, improve auto-mapping, add source tagging
- `package.json` — add `xlsx` dependency

**Column mapping for NSS file:**
- "English Name" -> `contact_name`
- "Arabic Name" -> `notes` (appended)
- "Phone" or "Mobile" -> `phone` (prefer Mobile if available)
- "Email" -> `email`  
- "Address" -> `notes` (appended)
- Source auto-set to "NSS Clients"

**Column mapping for TradeAtlas files:**
- "EXPORTER NAME" -> `company_name`
- "EXPORTER ADDRESS" -> `notes`
- "PRODUCT DETAILS" -> `industry`
- "EXPORTER COUNTRY" -> verify it's Jordan
- Source auto-set to "TradeAtlas"

### What won't change
- Database schema stays the same
- All existing telesales features (call logging, conversion, KPIs) work as-is
- The employee just needs to open Telesales > Import, select the Excel file, verify the mapping, and click Import

