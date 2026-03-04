---
description: Show revenue held in suspense by owner or well
argument-hint: [as-of-date] [level]
---

# Revenue Suspense Command

When the user invokes this command, generate the Revenue Suspense report.

## What to Do

1. Ask the user for the parameters:
   - As-of date (required, YYYY-MM-DD)
   - Report level (optional, default: "owner" — or "well" for line-item detail)
   - Owner code filter (optional)
   - Company code (optional, default: 200)

2. Choose query based on report level:

   **Owner Level (Summary):**
   - Query gold_fct_owner_revenue_detail
   - Filter: amount_suspended > 0 AND company_code = 200 AND production_date <= as_of_date
   - Group by: owner_code, owner_name
   - Calculate: well_count, production_month_count, net_value, total_tax, net_deductions, amount_suspended
   - Order by: amount_suspended DESC, owner_name

   **Well Level (Detail):**
   - Same query but no grouping (invoice grain)
   - Include: well_code, well_name, production_date, product, net_volume
   - Include all three suspense fields: item_suspense, owner_suspense, well_suspense
   - Order by: owner_code, well_code, production_date

3. Format the Excel output:
   - Dark blue header, dark blue/white bold grand total
   - All currency columns: Currency format (net_value, total_tax, net_deductions, amount_suspended)
   - Conditional formatting: Highlight amount_suspended > 0 in orange/red
   - Freeze panes at row 5
   - Filename: Revenue Suspense - {level} - {as_of_date}.xlsx

4. Return the Excel file to the user.

## Key Rules

- Filter: amount_suspended > 0 (only show items with active suspense)
- Redistributed items are already excluded at model build
- All-time accumulation: no start date, only production_date <= as_of_date
- Suspense reason may be null; show as "TBD"
- Report sorted by largest suspense amount first (helps prioritize resolution)
