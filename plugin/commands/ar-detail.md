---
description: Show invoice-level AR detail for specific owner(s)
argument-hint: [owner] [as-of-date]
---

# AR Invoice Detail Command

When the user invokes this command, generate the invoice-level AR detail report.

## What to Do

1. Ask the user for the parameters:
   - Owner name(s) or owner code(s) to report on (required)
   - As-of date for aging calculation (optional, default: last month-end)
   - Company code (optional, default: 200)

2. Query `FO_PRODUCTION_DB.GOLD_FINANCIAL.gold_fct_ar_aging_summary` at invoice grain:
   - Filter: include_record = 1 AND company_code = 200 AND invoice_date <= as_of_date AND remaining_balance <> 0
   - Owner filter: owner_code IN (...) OR owner_name ILIKE pattern
   - Order by: owner_name, invoice_date, invoice_number

3. For each invoice, calculate the aging bucket:
   - Over 90 days: DATEDIFF > 90
   - 61-90 days: DATEDIFF between 61 and 90
   - 31-60 days: DATEDIFF between 31 and 60
   - Current-30: DATEDIFF between 0 and 30

4. Format the Excel output:
   - Light blue subtotals by owner
   - Dark blue/white bold grand total
   - All amounts in currency format
   - Freeze panes at row 5
   - Filename includes owner name and as-of date

5. Return the Excel file to the user.

## Key Rules

- Always calculate aging bucket inline using DATEDIFF(day, invoice_date, as_of_date)
- Exclude include_record = 0 (missing invoice totals)
- Include only rows with remaining_balance <> 0
