---
name: revenue-missing-check
description: >
  Identifies owners who should have received revenue checks but didn't. Used for
  reconciliation and exception handling. Queries Formentera Operations gold model
  to detect missing payment records during specified periods.
version: 0.1.0
---

# Revenue Missing Check

## Overview
This skill identifies revenue check exceptions where owners had production activity but failed to receive expected revenue distributions. Essential for reconciliation workflows and payment audits.

## Gold Model
**Status:** Pending build
**Expected table:** `gold_rpt_revenue_missing_check` in `GOLD_FINANCIAL`

## Input Parameters
- `period_start` **(required)**: Start date of review period (YYYY-MM-DD)
- `period_end` **(required)**: End date of review period (YYYY-MM-DD)
- `company_code` (optional): Default '200'

## Output Columns
- Company
- Owner Code
- Owner Name
- Expected Check Amount
- Reason Missing
- Well Code
- Well Name
- Production Period

## Excel Output
- Tab: "Revenue Missing Check"
- Grouping: By owner
- Freeze: Row 5
- File: `Revenue Missing Check - {period_start} to {period_end}.xlsx`

## Notes
- Gold model not yet built; SQL query will be created to join production, revenue distribution, and check register tables
- Filters for missing revenue distributions where production exists
