---
name: check-register
description: >
  Generates "Revenue Check Register" showing revenue checks issued to owners
  in a period. Used to trigger "show me checks" or "revenue check register".
version: 0.1.0
---

# Revenue Check Register

Generate the check register from FO_PRODUCTION_DB.GOLD_FINANCIAL.gold_dim_revenue_check_register.

## Input Parameters

Gather from the user:
- `period_start`: Start date of check period (YYYY-MM-DD, required)
- `period_end`: End date of check period (YYYY-MM-DD, required)
- `company_code`: Optional, default "200" (Formentera Operations LLC)
- `owner_code`: Optional, filter to specific owner(s)
- `include_voided`: Optional, default NO (exclude voided checks unless requested)

## Query Structure

```sql
SELECT
  company_code,
  company_name,
  check_number,
  entity_code AS owner_code,
  entity_name AS owner_name,
  check_date,
  check_type_name AS check_type,
  check_amount,
  voucher_number,
  reconciled_flag AS reconciled,
  voided_flag AS voided,
  void_date
FROM FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_DIM_REVENUE_CHECK_REGISTER
WHERE check_date >= :period_start
  AND check_date <= :period_end
  AND company_code = :company_code
  AND voided_flag = 'NO'
ORDER BY check_date, check_number
```

Add optional filters:
- Owner filter: `AND entity_code IN (:owner_codes)`
- Include voided: Remove `AND voided_flag = 'NO'` if user requests voided checks

## Output Columns

Company Code, Company Name, Check #, Owner Code, Owner Name, Check Date, Check Type, Check Amount, Voucher #, Reconciled, Voided, Void Date

## Check Types

Common values:
- "Standard Check": Regular revenue payment
- "ACH": Electronic transfer
- "Wire": Wire transfer
- "System Check": WI System generated check

## Excel Output Format

- Filename: `Revenue Check Register - {period} - {company}.xlsx`
- Tab: "Revenue Check Register"
- Owner subtotals: Light blue background with subtotal amounts
- Grand total row: Dark blue background with white text
- All amounts: Currency formatted
- Check date: Date formatted (MM/DD/YYYY)
- Freeze panes: Row 5

## Edge Cases

- WI System Checks (check_type = "System Check") may have special handling — include normally
- entity_code is the owner code; join to other models on this field
- reconciled_flag and voided_flag may be null or boolean — standardize to "YES"/"NO" in output
- void_date is populated only if voided_flag = 'YES'
- Empty result (no checks in period) is valid; show message
