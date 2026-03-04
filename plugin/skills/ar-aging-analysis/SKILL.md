---
name: ar-aging-analysis
description: "AR aging analysis by owner — outstanding balances bucketed by age from gold_fct_ar_aging_summary only. Use for aging drill-down, hold billing review, or invoice-level analysis."
---

# AR Aging Summary

Generate the AR Aging Summary report from FO_PRODUCTION_DB.GOLD_FINANCIAL.gold_fct_ar_aging_summary.

## Input Parameters

Gather from the user:
- `as_of_date`: Last day of report month (YYYY-MM-DD, required — e.g. 2026-01-31)
- `company_code`: Ask per accounting-assistant instructions
- `owner_codes`: Optional, filter to specific owners (comma-separated codes)

For period interpretation: "January 2026" means `as_of_date = 2026-01-31`.

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
- Group by: company_code, owner_code, owner_name, hold_billing

## Output Columns

Company Code, Owner Code, Owner Name, Hold Billing, Over 90, 61-90, 31-60, Current-30, Total Outstanding

## Excel Output Format

- Filename: `AR Aging Analysis - As Of {as_of_date}.xlsx`
- Tab: "AR Aging Summary"
- Header: Dark blue background
- All numeric columns: Currency formatted
- Grand total row: Dark blue background with white bold text
- Panes: Freeze at row 5

## Edge Cases

- `remaining_balance` is point-in-time as of the last model load — not historical; document this limitation to the user
- `include_record = 0` marks matched advance/closeout pairs that net to zero; always exclude these
