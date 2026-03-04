---
description: JIB Detail — line-item charges by account
argument-hint: "[period-start] [period-end] [company] [well] [partner]"
---

# jib-detail

Generate a JIB Detail report with line-item detail of Joint Interest Billing charges by account and well.

## Usage
```
/jib-detail [period-start] [period-end] [company] [well] [partner]
```

## Arguments
- `period-start` (required): Start date of reporting period (YYYY-MM-DD)
- `period-end` (required): End date of reporting period (YYYY-MM-DD)
- `company` (optional): Company code (default: '200')
- `well` (optional): Specific well code to filter
- `partner` (optional): Specific partner code to filter

## Examples
```
/jib-detail 2025-01-01 2025-03-31
/jib-detail 2025-01-01 2025-03-31 200
/jib-detail 2025-01-01 2025-03-31 200 FAT_TIRE_12
/jib-detail 2025-01-01 2025-03-31 200 FAT_TIRE_12 SHELL
```

## Output
- Excel file: `JIB Detail - {period_start} to {period_end}.xlsx`
- Grouped by well and account with subtotals
- Shows account-level JIB charge breakdown and partner shares

## Note
Currently queries staging model. Will be updated when gold_fct_jib_detail is promoted.
