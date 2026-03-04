---
name: ar-cross-clear
description: >
  Generates "AR Cross-Clear" showing GL journal entries netting Revenue Payable
  against AR JIB accounts. Used to trigger "show me cross-clears" or "revenue netting".
version: 0.1.0
---

# AR Cross-Clear Report

Generate GL journal entries netting Revenue Payable (501.x) against AR JIB (130.x) from FO_PRODUCTION_DB.GOLD_FINANCIAL.gold_fct_gl_details.

## Input Parameters

Gather from the user:
- `period_start`: Start date of period (YYYY-MM-DD, required)
- `period_end`: End date of period (YYYY-MM-DD, required)
- `owner_code`: Optional, filter to specific owner(s)
- `company_code`: Optional, default "200" (Formentera Operations LLC)

## Query Structure

```sql
SELECT
  main_account,
  sub_account,
  account_name,
  voucher_code,
  entity_type,
  entity_code,
  entity_name,
  CAST(journal_date AS DATE) AS journal_date,
  CAST(accrual_date AS DATE) AS accrual_date,
  gl_description,
  net_amount
FROM FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_FCT_GL_DETAILS
WHERE main_account IN ('501', '130')
  AND sub_account IN ('1', '2', '3', '4')
  AND (gl_description LIKE '%Net Revenue Against A/R%'
       OR gl_description LIKE '%AR Cross Clear%')
  AND journal_date >= :period_start
  AND journal_date <= :period_end
  AND company_code = :company_code
ORDER BY voucher_code, main_account
```

Add optional owner filter: `AND entity_code IN (:owner_codes)`

## Pairing Logic

Each cross-clear creates two rows per voucher:
- One row: Debit to 501.x (Revenue Payable) — positive net_amount
- One row: Credit to 130.x (AR JIB) — negative net_amount
- These two rows net to zero per voucher

## Output Columns

Main Account, Sub Account, Account Name, Voucher Code, Entity Type, Entity Code, Entity Name, Journal Date, Accrual Date, Description, Net Amount

## Excel Output Format

- Filename: `AR Cross-Clear - {period} - {company}.xlsx`
- Tab: "AR Cross-Clear"
- Debit amounts (501.x): Normal black text
- Credit amounts (130.x): Red text
- Subtotal per voucher: Light blue background
- Grand total: Dark blue background with white text
- Freeze panes: Row 5
- Currency format: All amount columns

## Edge Cases

- Voucher codes may span multiple accounts (501 and 130) but should net to zero per voucher
- Entity code may differ from owner code in some cases — verify join keys
- gl_description contains the reason for netting (e.g., "Month-end accrual", "Billing cycle reconciliation")
- accrual_date and journal_date may differ (accrual is the business date, journal is the posting date)
