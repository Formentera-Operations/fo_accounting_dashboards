# Skill: /check-register — Revenue Check Register

## Purpose
Returns revenue checks issued to owners in a given period. Used by the accounting team
to verify payments sent, reconcile the Rev Pmt column in the AR Summary, and identify
voided or unreconciled checks.

## ODA Equivalent
Report 430 — Revenue Check Register (Brief)

## Gold Models Used
- `FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_DIM_REVENUE_CHECK_REGISTER` — check grain

## Input Parameters

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `period_start` | Yes | First day of period | `2026-01-01` |
| `period_end` | Yes | Last day of period | `2026-01-31` |
| `company_code` | No | Default `200` | `200` |
| `owner_code` | No | Filter to specific owner | `2509` |
| `include_voided` | No | Default excludes voided (`voided = 'NO'`); set `YES` to include | `NO` |

If user says "January check register", set `period_start = 2026-01-01`, `period_end = 2026-01-31`.

## Standard Filters
```sql
WHERE check_date >= :period_start
  AND check_date <= :period_end
  AND voided = 'NO'
  AND company_code = '200'
ORDER BY owner_name, check_date, check_number
```

## Output Columns

| Column | Source |
|--------|--------|
| Company Code | `company_code` |
| Company Name | `company_name` |
| Check # | `check_number` |
| Owner Code | `entity_code` |
| Owner Name | `entity_name` |
| Check Date | `check_date` |
| Check Type | `check_type_name` |
| Check Amount | `check_amount` |
| Voucher # | `voucher_code` |
| Reconciled | `reconciled` (`YES` / blank) |
| Voided | `voided` (`YES` / `NO`) |
| Void Date | `void_date` |

## Response Format
Lead with: "In January 2026, {N} revenue checks totaling ${X} were issued to {M} owners."

Show the table ordered by owner name, then check date.

For reconciliation with the AR Summary Rev Pmt column: group by `entity_code` and
`SUM(check_amount)` to match the supplemental join used in `/ar-aging`.

## Excel Format
- **Tab name:** `Revenue Check Register`
- **Subtitle:** "Company {code} | {period_start} to {period_end} | Non-voided checks"
- **Currency columns:** Check Amount
- **Owner subtotals:** light blue fill
- **Grand total row:** dark blue fill, white bold text
- **Freeze panes:** Row 5
- **File name:** `Revenue Check Register - {period}.xlsx`

## Edge Cases
- **WI System Checks:** ODA's AR Summary Rev Pmt column may exclude System Checks
  issued to WI operators. If `/ar-aging` shows a Rev Pmt for a WI owner that the
  team doesn't expect, run `/check-register` to identify the check type. Filter to
  `check_type_name NOT LIKE '%System%'` if WI intercompany checks should be excluded.
- **Voided checks:** By default, voided checks are excluded (`voided = 'NO'`). If the
  user asks about voided checks or why a total doesn't match, re-run with `include_voided = YES`.
- **entity_code vs owner_code join:** The check register uses `entity_code` as the owner
  identifier, not `owner_code`. These are equivalent (confirmed via join validation) but
  the column name differs from the AR aging models.
