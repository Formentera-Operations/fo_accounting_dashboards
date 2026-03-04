---
name: revenue-suspense
description: >
  Generates "Revenue Suspense" report showing owners with revenue held in suspense
  pending resolution. Used to trigger "show me suspense" or "revenue held".
version: 0.1.0
---

# Revenue Suspense Report

Generate the revenue suspense summary from FO_PRODUCTION_DB.GOLD_FINANCIAL.gold_fct_owner_revenue_detail.

## Input Parameters

Gather from the user:
- `as_of_date`: As-of date for the report (YYYY-MM-DD, required)
- `company_code`: Optional, default "200" (Formentera Operations LLC)
- `owner_code`: Optional, filter to specific owner(s)
- `level`: Optional, report level (default: "owner", or "well" for well-level detail)

## Query Structure

### Owner Level (Summary)

```sql
SELECT
  owner_code,
  owner_name,
  COUNT(DISTINCT well_code) AS well_count,
  COUNT(DISTINCT production_date) AS production_month_count,
  SUM(net_value) AS net_value,
  SUM(total_tax) AS total_tax,
  SUM(net_deductions) AS net_deductions,
  SUM(amount_suspended) AS amount_suspended,
  LISTAGG(DISTINCT suspense_reason, '; ') AS suspense_reasons
FROM FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_FCT_OWNER_REVENUE_DETAIL
WHERE amount_suspended > 0
  AND company_code = :company_code
  AND production_date <= :as_of_date
GROUP BY owner_code, owner_name
ORDER BY amount_suspended DESC, owner_name
```

### Well Level (Detail)

```sql
SELECT
  owner_code,
  owner_name,
  well_code,
  well_name,
  production_date,
  product,
  net_volume,
  net_value,
  total_tax,
  net_deductions,
  item_suspense,
  owner_suspense,
  well_suspense,
  amount_suspended,
  suspense_reason
FROM FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_FCT_OWNER_REVENUE_DETAIL
WHERE amount_suspended > 0
  AND company_code = :company_code
  AND production_date <= :as_of_date
ORDER BY owner_code, well_code, production_date
```

Standard filters: `WHERE amount_suspended > 0 AND company_code = :company_code AND production_date <= :as_of_date`

Add optional owner filter: `AND owner_code IN (:owner_codes)`

## Suspense Fields

The model tracks three levels of suspension:
- `item_suspense`: Line-item level hold (revenue to check, product validation)
- `owner_suspense`: Owner-level hold (accounting review, documentation)
- `well_suspense`: Well-level hold (operational issue, shut-in)

All three aggregate into `amount_suspended` in the output.

## Output Columns

**Owner Level:**
Owner Code, Owner Name, Well Count, Production Months, Net Value, Total Tax, Net Deductions, Amount Suspended, Suspense Reason

**Well Level:**
Owner Code, Owner Name, Well Code, Well Name, Production Date, Product, Net Volume, Item Suspense, Owner Suspense, Well Suspense, Net Value, Total Tax, Net Deductions, Amount Suspended, Suspense Reason

## Excel Output Format

- Filename: `Revenue Suspense - {level} - {as_of_date}.xlsx`
- Tab: "Revenue Suspense"
- Currency columns: All net/suspense amounts formatted
- Grand total row: Dark blue background with white text
- Freeze panes: Row 5
- Conditional formatting: Highlight amount_suspended > 0 in orange/red

## Edge Cases

- Redistributed items (payment_status_id = 8) are excluded at model build — no filtering needed
- Accumulation is all-time with no start date filter — shows total suspense ever recorded
- Empty result is valid (no suspense for date range or owner) — show message
- suspense_reason may be null for legacy records; show as "TBD"
- Well Name may be null for some ledger-type records; show well_code only
