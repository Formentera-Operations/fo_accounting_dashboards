---
description: Show GL entries netting revenue against AR
argument-hint: [period-start] [period-end]
---

# AR Cross-Clear Command

When the user invokes this command, generate the AR Cross-Clear report.

## What to Do

1. Ask the user for the parameters:
   - Period start date (required, YYYY-MM-DD)
   - Period end date (required, YYYY-MM-DD)
   - Owner code filter (optional)
   - Company code (optional, default: 200)

2. Query `FO_PRODUCTION_DB.GOLD_FINANCIAL.gold_fct_gl_details`:
   - Filter: main_account IN ('501', '130') AND sub_account IN ('1', '2', '3', '4')
   - Description filter: gl_description LIKE '%Net Revenue Against A/R%' OR '%AR Cross Clear%'
   - Date range: journal_date >= period_start AND journal_date <= period_end
   - Company code: 200
   - Order by: voucher_code, main_account

3. For each row, identify the type:
   - Account 501.x (Revenue Payable) = Debit side (normal, black text)
   - Account 130.x (AR JIB) = Credit side (red text)

4. Verify pairing logic:
   - Each voucher should have exactly two rows (one 501.x, one 130.x)
   - The two rows should net to zero (validate in report)

5. Format the Excel output:
   - Black text for debits (501.x)
   - Red text for credits (130.x)
   - Light blue subtotals per voucher
   - Dark blue/white bold grand total
   - Freeze panes at row 5
   - Filename: AR Cross-Clear - {period} - {company}.xlsx

6. Return the Excel file to the user.

## Key Rules

- Always verify pairing: each voucher has debit (501.x) and credit (130.x)
- Sum per voucher should equal zero
- Include both journal_date and accrual_date (accrual is the business date)
