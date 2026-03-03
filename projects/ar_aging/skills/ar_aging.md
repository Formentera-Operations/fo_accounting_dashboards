# Skill: /ar-aging — AR Aging Summary by Owner

## Purpose
Produces the owner-level AR Aging Summary report — the primary collections tool for the
accounting team. Shows outstanding AR balances bucketed by age, plus supplemental columns
for current-period netting, revenue payments, suspense, and JIB cycle payments. Replaces
the manual ODA download + pivot workflow.

## ODA Equivalent
Report ARR — AR Aging Report (owner-level aggregation view)

## Gold Models Used
- `FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_FCT_AR_AGING_SUMMARY` — invoice grain, aging base
- `FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_FCT_GL_DETAILS` — period netting (cross-clear GL entries)
- `FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_DIM_REVENUE_CHECK_REGISTER` — period revenue payments
- `FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_FCT_OWNER_REVENUE_DETAIL` — revenue suspense balances
- `FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_FCT_AR_AGING_DETAIL` — JIB cycle payments

## Input Parameters

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `as_of_date` | Yes | Last day of the report month | `2026-02-28` |
| `period_start` | Yes | First day of supplemental activity period (prior month) | `2026-01-01` |
| `period_end` | Yes | Last day of supplemental activity period | `2026-01-31` |
| `jib_cycle_start` | Yes | JIB billing cycle start (from JIB header) | `2025-12-18` |
| `jib_cycle_end` | Yes | JIB billing cycle end (from JIB header) | `2026-01-17` |
| `company_code` | No | Default `200` (Formentera Operations LLC) | `200` |
| `owner_codes` | No | Filter to specific owners; omit for all | `83113, 2509` |

**Always state the company default:** "Running for Company 200 (Formentera Operations LLC) —
let me know if you need a different company."

If the user says "January 2026 AR aging", interpret as:
- `as_of_date = 2026-01-31`
- `period_start = 2025-12-01`, `period_end = 2025-12-31`
- Ask for JIB cycle dates or default to prior cycle

## Standard Filters
```sql
WHERE include_record = 1          -- excludes matched advance/closeout pairs
  AND company_code = '200'
  AND invoice_date <= :as_of_date
HAVING SUM(remaining_balance) <> 0
```

## Aging Bucket Logic
**Never use the gold model's pre-computed bucket columns** — they use `current_date()` at
build time. Always recalculate inline:

```sql
SUM(CASE WHEN DATEDIFF('day', invoice_date, :as_of_date) > 90   THEN remaining_balance ELSE 0 END) AS over_90,
SUM(CASE WHEN DATEDIFF('day', invoice_date, :as_of_date) BETWEEN 61 AND 90 THEN remaining_balance ELSE 0 END) AS days_61_90,
SUM(CASE WHEN DATEDIFF('day', invoice_date, :as_of_date) BETWEEN 31 AND 60 THEN remaining_balance ELSE 0 END) AS days_31_60,
SUM(CASE WHEN DATEDIFF('day', invoice_date, :as_of_date) BETWEEN 0  AND 30 THEN remaining_balance ELSE 0 END) AS days_current_30,
```

## Output Columns (matches ODA AR Summary layout)

| Column | Source |
|--------|--------|
| Company Code | `company_code` |
| Owner Code | `owner_code` |
| Owner Name | `owner_name` |
| Hold Billing | `MAX(hold_billing)` |
| Over 90 Days | inline DATEDIFF > 90 |
| 61-90 Days | inline DATEDIFF 61-90 |
| 31-60 Days | inline DATEDIFF 31-60 |
| 30 Days-Current | inline DATEDIFF 0-30 |
| Total Outstanding | `SUM(remaining_balance)` |
| [Period] Netting | `gold_fct_gl_details.net_amount` |
| [Period] Rev Pmt | `gold_dim_revenue_check_register.check_amount` |
| Rev Suspense | `gold_fct_owner_revenue_detail.amount_suspended` |
| JIB Pmts | `gold_fct_ar_aging_detail.balance_due` (payments/nettings in cycle) |

## Join Keys
`gold_fct_ar_aging_summary.owner_code` = `gold_fct_gl_details.entity_code` = `gold_dim_revenue_check_register.entity_code`

## Excel Format
- **Tab name:** `AR Aging Summary`
- **Header:** "Formentera Operations LLC — AR Aging Summary by Owner"
- **Subtitle:** "Company {code} | As of {as_of_date} | {Period} Activity"
- **Currency columns:** Over 90, 61-90, 31-60, Current-30, Total Outstanding, Netting, Rev Pmt, Suspense, JIB Pmts
- **Grand total row:** dark blue fill, white bold text
- **Freeze panes:** Row 5 (rows 1-2 = header, row 3 = blank, row 4 = column headers)
- **File name:** `AR Aging Summary - {period} - As Of {as_of_date}.xlsx`

## Edge Cases
- **WI System Checks:** `gold_dim_revenue_check_register` includes System Checks issued to WI
  operators (e.g. Britanco). ODA excludes these from the Rev Pmt column. Flag to user if a
  WI owner shows an unexpected Rev Pmt value.
- **Point-in-time limitation:** `remaining_balance` reflects current state. Over-90 balances
  will be lower than historical reports because older invoices have since been paid. Expected.
- **JIB cycle dates:** Ask user for cycle start/end dates — do not default. These vary monthly
  and are visible in the ODA JIB report header (e.g. "11/19-12/17").
- **include_record = 0:** Advance/closeout invoice pairs. The standard filter excludes these.
  If user asks "why doesn't my total match", suggest removing the filter to check.
