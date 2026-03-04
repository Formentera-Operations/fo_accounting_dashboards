---
name: ar-aging-analysis
description: >
  Generates an "AR Aging Summary" report showing outstanding AR balances bucketed by age,
  with supplemental columns for netting, revenue payments, suspense, and JIB cycle payments.
  Used to trigger "show me the aging" or "run the AR aging report".
version: 0.1.0
---

# AR Aging Summary

Generate the AR Aging Summary report from FO_PRODUCTION_DB.GOLD_FINANCIAL.gold_fct_ar_aging_summary.

## Input Parameters

Gather these from the user (required unless noted optional):
- `as_of_date`: Last day of report month (format: YYYY-MM-DD, e.g., 2026-01-31)
- `period_start`: First day of prior month for activity columns (YYYY-MM-DD)
- `period_end`: Last day of prior month (YYYY-MM-DD)
- `jib_cycle_start`: JIB billing cycle start from JIB header (YYYY-MM-DD)
- `jib_cycle_end`: JIB billing cycle end (YYYY-MM-DD)
- `company_code`: Optional, default "200" (Formentera Operations LLC)
- `owner_codes`: Optional, filter to specific owners (comma-separated codes)

For period interpretation: "January 2026 AR aging" means as_of_date=2026-01-31, period_start=2025-12-01, period_end=2025-12-31.

## Aging Bucket Rules

**CRITICAL:** Never use the gold model's pre-computed bucket columns (`balance_90_plus_days`, etc.) — they use `current_date()` at build time and are only accurate on the day the model ran. Always recalculate inline using the user-supplied `as_of_date`:

| ODA Bucket Label | DATEDIFF Range | Inline SQL |
|-----------------|----------------|-----------|
| Over 90 Days | > 90 | `DATEDIFF('day', invoice_date, :as_of_date) > 90` |
| 90-61 Days | 61–90 | `DATEDIFF('day', invoice_date, :as_of_date) BETWEEN 61 AND 90` |
| 60-31 Days | 31–60 | `DATEDIFF('day', invoice_date, :as_of_date) BETWEEN 31 AND 60` |
| 30 Days-Current | 0–30 | `DATEDIFF('day', invoice_date, :as_of_date) BETWEEN 0 AND 30` |

```sql
SUM(CASE WHEN DATEDIFF('day', invoice_date, :as_of_date) > 90        THEN remaining_balance ELSE 0 END) AS over_90,
SUM(CASE WHEN DATEDIFF('day', invoice_date, :as_of_date) BETWEEN 61 AND 90 THEN remaining_balance ELSE 0 END) AS days_61_90,
SUM(CASE WHEN DATEDIFF('day', invoice_date, :as_of_date) BETWEEN 31 AND 60 THEN remaining_balance ELSE 0 END) AS days_31_60,
SUM(CASE WHEN DATEDIFF('day', invoice_date, :as_of_date) BETWEEN 0  AND 30 THEN remaining_balance ELSE 0 END) AS days_current_30,
```

## Default Filters

Always apply unless the user explicitly overrides:

| Filter | Value | Reason |
|--------|-------|--------|
| `include_record` | `= 1` | Excludes matched advance/closeout pairs that net to zero |
| `invoice_date` | `<= :as_of_date` | Point-in-time: only invoices billed on or before the report date |
| `remaining_balance` | `<> 0` (HAVING) | Suppresses fully paid invoices from the output |

## Query Structure

Query `gold_fct_ar_aging_summary` with:
- Standard filters: `WHERE include_record = 1 AND company_code = :company_code AND invoice_date <= :as_of_date`
- Add owner code filter if provided: `AND owner_code IN (:owner_codes)`
- Having clause: `HAVING SUM(remaining_balance) <> 0`
- Group by: owner_code, owner_name

Join supplemental models for netting/payments columns:
- `gold_fct_gl_details` (join on owner_code = entity_code) for netting
- `gold_dim_revenue_check_register` (join on owner_code = entity_code) for rev payments
- `gold_fct_owner_revenue_detail` (join on owner_code = entity_code) for suspense
- `gold_fct_ar_aging_detail` (join on owner_code) for JIB payments

## Output Columns

Company Code, Owner Code, Owner Name, Hold Billing, Over 90, 61-90, 31-60, Current-30, Total Outstanding, [Period] Netting, [Period] Rev Pmt, Rev Suspense, JIB Pmts

## Excel Output Format

- Filename: `AR Aging Summary - {period} - As Of {as_of_date}.xlsx`
- Tab: "AR Aging Summary"
- Header: Dark blue background
- All numeric columns: Currency formatted
- Grand total row: Dark blue background with white bold text
- Panes: Freeze at row 5

## Edge Cases

- WI System Checks may appear in the revenue payment column — include them
- remaining_balance is point-in-time as of load date; document this limitation
- include_record=0 marks advance/closeout pairs; exclude these
- JIB cycle dates vary monthly — ask the user if not provided
