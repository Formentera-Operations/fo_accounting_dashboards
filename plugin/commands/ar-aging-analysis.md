---
description: Generate AR aging summary by period and company
argument-hint: [period] [company]
---

# AR Aging Summary Command

When the user invokes this command, generate the AR Aging Summary report.

## What to Do

1. Ask the user for the reporting parameters:
   - Confirm the report month (e.g., "January 2026")
   - Confirm the company code (default: 200 for Formentera Operations LLC)
   - Ask for owner filters if they want a subset (optional)
   - Ask for JIB cycle start/end dates (required)

2. Convert the period to SQL parameters:
   - `as_of_date`: Last day of the month
   - `period_start`: First day of prior month
   - `period_end`: Last day of prior month

3. Query `FO_PRODUCTION_DB.GOLD_FINANCIAL.gold_fct_ar_aging_summary` with:
   - Inline aging bucket calculations (over_90, days_61_90, days_31_60, days_current_30)
   - Include_record = 1 filter
   - Company code filter
   - Owner code filter if provided

4. Join supplemental models:
   - gold_fct_gl_details for netting activity
   - gold_dim_revenue_check_register for revenue payments
   - gold_fct_owner_revenue_detail for suspense amounts
   - gold_fct_ar_aging_detail for JIB payments

5. Format results in Excel:
   - Dark blue header row
   - Currency formatted numbers
   - Dark blue/white bold grand total
   - Freeze panes at row 5
   - Filename: AR Aging Summary - {month} - As Of {date}.xlsx

6. Return the Excel file to the user.

## Key Rules

- Never use pre-computed bucket columns from the model — recalculate aging inline using DATEDIFF
- Always apply include_record = 1 filter (exclude advance/closeout pairs)
- Ask clarifying questions if JIB cycle dates are missing
