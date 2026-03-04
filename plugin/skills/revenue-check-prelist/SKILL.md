---
name: revenue-check-prelist
description: >
  Preview of revenue checks before they are issued. Shows calculated payments
  to owners and partners before the check run is executed, enabling approval
  workflows and payment validation.
version: 0.1.0
---

# Revenue Check Prelist

## Overview
This skill provides a pre-issuance view of revenue check calculations, allowing operators to review and validate payments before checks are printed and distributed.

## Gold Model
**Status:** Partial coverage
**Source table:** `gold_dim_revenue_check_register` in `GOLD_FINANCIAL`
**Notes:** May require additional fields or status filter to distinguish prelist from posted checks

## Input Parameters
- `period_start` **(required)**: Start date of check period (YYYY-MM-DD)
- `period_end` **(required)**: End date of check period (YYYY-MM-DD)
- `company_code` (optional): Default '200'
- `check_status` (optional): 'prelist', 'posted', or 'all' (default: 'prelist')

## Output Columns
- Company
- Owner Code
- Owner Name
- Check Amount (calculated)
- Well Count
- Production Period
- Check Status

## Excel Output
- Tab: "Revenue Check Prelist"
- Grouping: By owner
- Totals: Grand total row
- Freeze: Row 5
- File: `Revenue Check Prelist - {period_start} to {period_end}.xlsx`

## Notes
- Filters by check_status to show pre-issuance records
- Supports check approval workflows before distribution
