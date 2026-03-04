---
name: ar-summary
description: "Generates a simple AR balance summary by owner with inline aging buckets. No supplemental joins — output is Company Code, Owner Code, Owner Name, Over 90, 61-90, 31-60, Current-30, Total Outstanding."
---

# AR Summary

Generate a concise AR balance summary from `FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_FCT_AR_AGING_SUMMARY`.

## Input Parameters

Gather from the user:
- `as_of_date`: Last day of report month (YYYY-MM-DD, required — e.g. 2026-01-31)
- `company_code`: Ask per accounting-assistant instructions
- `owner_codes`: Optional, filter to specific owners (comma-separated codes)

For period interpretation: "January 2026" means `as_of_date = 2026-01-31`.

## Default Filters

Always apply unless the user explicitly overrides:

| Filter | Value | Reason |
|--------|-------|--------|
| `include_record` | `= 1` | Excludes matched advance/closeout pairs that net to zero |
| `invoice_date` | `<= :as_of_date` | Point-in-time: only invoices billed on or before the report date |
| `remaining_balance` | `<> 0` (HAVING) | Suppresses fully paid invoices from the output |

## Aging Bucket Rules

Never use the gold model's pre-computed bucket columns — always recalculate inline using `as_of_date`. See ar-aging skill for full bucket reference.

## Query

```sql
WITH params AS (
    SELECT :as_of_date::DATE AS as_of_date
)
SELECT
    s.company_code,
    s.owner_code,
    s.owner_name,
    SUM(CASE WHEN DATEDIFF('day', s.invoice_date, p.as_of_date) > 90
             THEN s.remaining_balance ELSE 0 END) AS over_90,
    SUM(CASE WHEN DATEDIFF('day', s.invoice_date, p.as_of_date) BETWEEN 61 AND 90
             THEN s.remaining_balance ELSE 0 END) AS days_61_90,
    SUM(CASE WHEN DATEDIFF('day', s.invoice_date, p.as_of_date) BETWEEN 31 AND 60
             THEN s.remaining_balance ELSE 0 END) AS days_31_60,
    SUM(CASE WHEN DATEDIFF('day', s.invoice_date, p.as_of_date) BETWEEN 0  AND 30
             THEN s.remaining_balance ELSE 0 END) AS days_current_30,
    SUM(s.remaining_balance) AS total_outstanding
FROM FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_FCT_AR_AGING_SUMMARY s
CROSS JOIN params p
WHERE s.include_record = 1
  AND s.company_code = :company_code
  AND s.invoice_date <= p.as_of_date
GROUP BY s.company_code, s.owner_code, s.owner_name
HAVING SUM(s.remaining_balance) <> 0
ORDER BY s.owner_name
```

Add optional owner filter before GROUP BY: `AND s.owner_code IN (:owner_codes)`

## Output Columns

Company Code, Owner Code, Owner Name, Over 90, 61-90 Days, 31-60 Days, Current-30, Total Outstanding

## Excel Output Format

- Filename: `AR Summary - As Of {as_of_date}.xlsx`
- Tab: "AR Summary"
- Header: Dark blue background, white bold text
- All amount columns: Currency formatted (`$#,##0.00`)
- Grand total row: Dark blue background, white bold text
- Freeze panes: Row 2
