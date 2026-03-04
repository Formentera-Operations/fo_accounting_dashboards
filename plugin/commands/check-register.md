---
description: Show revenue checks issued in period
argument-hint: [period-start] [period-end]
---

# Revenue Check Register Command

When the user invokes this command, generate the Revenue Check Register report.

## What to Do

1. Ask the user for the parameters:
   - Period start date (required, YYYY-MM-DD)
   - Period end date (required, YYYY-MM-DD)
   - Company code (optional, default: 200)
   - Owner code filter (optional)
   - Include voided checks (optional, default: NO)

2. Query `FO_PRODUCTION_DB.GOLD_FINANCIAL.gold_dim_revenue_check_register`:
   - Filter: check_date >= period_start AND check_date <= period_end AND company_code = 200
   - Voided filter: voided_flag = 'NO' (unless user requests voided checks)
   - Owner filter: entity_code IN (...) if provided
   - Order by: check_date, check_number

3. Map the columns:
   - entity_code → owner_code
   - entity_name → owner_name
   - check_type_name → check_type
   - reconciled_flag → reconciled (standardize to YES/NO)
   - voided_flag → voided (standardize to YES/NO)

4. Format the Excel output:
   - Light blue subtotals by owner with subtotal amounts
   - Dark blue/white bold grand total row
   - All amounts in currency format
   - Check dates in MM/DD/YYYY format
   - Freeze panes at row 5
   - Filename: Revenue Check Register - {period} - {company}.xlsx

5. Return the Excel file to the user.

## Key Rules

- Default to excluding voided checks (voided_flag = 'NO')
- Use entity_code as the owner_code join key
- Include WI System Checks normally (no special filtering)
- Show void_date only if voided = YES
