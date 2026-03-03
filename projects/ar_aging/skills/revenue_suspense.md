# Skill: /revenue-suspense — Revenue Suspense by Owner

## Purpose
Returns owners with revenue held in suspense — amounts that have been earned but not
paid out pending resolution of a blocking condition (missing division order, bad address,
title dispute, etc.). Used to identify collection risk and prioritize resolution work.

## ODA Equivalent
Report 440 — Revenue Suspense Report (Owner and Well level)

## Gold Models Used
- `FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_FCT_OWNER_REVENUE_DETAIL` — owner revenue grain

## Input Parameters

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `as_of_date` | No | Include suspense through this date; defaults to `CURRENT_DATE()` | `2026-02-28` |
| `company_code` | No | Default `200` | `200` |
| `owner_code` | No | Filter to specific owner | `25691` |
| `level` | No | `owner` (default) or `well` — grain of output | `owner` |

## Standard Filters
```sql
WHERE amount_suspended > 0
  AND company_code = '200'
  AND production_date <= :as_of_date
```

## Output Columns — Owner Level (default)

| Column | Source |
|--------|--------|
| Owner Code | `owner_code` |
| Owner Name | `owner_name` |
| Well Count | `COUNT(DISTINCT well_code)` |
| Production Months | `COUNT(DISTINCT production_date)` |
| Net Value | `SUM(net_value)` |
| Total Tax | `SUM(total_tax)` |
| Net Deductions | `SUM(net_deductions)` |
| Amount Suspended | `SUM(amount_suspended)` |
| Suspense Reason | `MAX(item_suspense)` or `MAX(owner_suspense)` |

## Output Columns — Well Level

| Column | Source |
|--------|--------|
| Owner Code | `owner_code` |
| Owner Name | `owner_name` |
| Well Code | `well_code` |
| Well Name | `well_name` |
| Production Date | `production_date` |
| Product | `product_name` |
| Net Volume | `net_volume` |
| Net Value | `net_value` |
| Amount Suspended | `amount_suspended` |
| Item Suspense | `item_suspense` |
| Owner Suspense | `owner_suspense` |
| Well Suspense | `well_suspense` |

## Response Format
Lead with: "As of {as_of_date}, {N} owners have revenue in suspense totaling ${X}."

Highlight any single owner with suspense > $100K as noteworthy. For example:
> "Tecolote Holdings (25691) has $2.14M in suspense — the largest single owner.
> This may warrant immediate follow-up."

For well-level drill-down, use `level = well` to see which specific wells and
production months are driving the suspense balance.

## Excel Format
- **Tab name:** `Revenue Suspense`
- **Subtitle:** "Company {code} | As of {as_of_date} | Owners with suspended revenue"
- **Currency columns:** Net Value, Total Tax, Net Deductions, Amount Suspended
- **Grand total row:** dark blue fill, white bold text
- **Freeze panes:** Row 5
- **File name:** `Revenue Suspense - As Of {as_of_date}.xlsx`

## Edge Cases
- **Redistributed items excluded:** `payment_status_id = 8` (redistributed revenue) is
  filtered out at model build time — no runtime filter needed. The model already reflects
  net suspended amounts.
- **Suspense category hierarchy:** Three suspense fields exist at different levels:
  - `item_suspense` — line-item level suspense reason
  - `owner_suspense` — owner's default suspense category
  - `well_suspense` — well-level suspend revenue flag
  Check all three when diagnosing why an owner is in suspense.
- **Zero-suspense owners:** The standard filter `amount_suspended > 0` excludes owners
  with no current suspense. If user asks about a specific owner showing $0, verify
  whether suspense was recently resolved.
- **All-time accumulation:** `production_date <= as_of_date` with no start date captures
  all historical suspense. If the total looks large, note that it spans all production
  periods — not just the current month.
