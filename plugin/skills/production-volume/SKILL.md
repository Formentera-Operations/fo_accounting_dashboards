---
name: production-volume
description: >
  Monthly production volumes by well and product. Reports gross and net volumes
  for oil, gas, NGL, and water across all wells, supporting production-based
  revenue calculations and volume reconciliation.
version: 0.1.0
---

# Production Volume Report

## Overview
This skill provides monthly production metrics by well and product type, supporting production-based revenue reconciliation and operational analysis.

## Gold Model
**Status:** Complete
**Source table:** `gold_fct_production_monthly` in `GOLD_PRODUCTION`

## Input Parameters
- `period_start` **(required)**: Start month (YYYY-MM-DD, uses first of month)
- `period_end` **(required)**: End month (YYYY-MM-DD, uses last day of month)
- `company_code` (optional): Default '200'
- `well_code` (optional): Filter to specific well
- `product` (optional): Filter by product ('oil', 'gas', 'ngl', 'water')

## Output Columns
- Company
- Well Code
- Well Name
- Production Month
- Product
- Gross Volume
- Net Volume
- Unit (BBL, MCF, etc.)
- Disposition

## Excel Output
- Tab: "Production Volume"
- Grouping: By well
- Columns: Monthly volumes in separate columns
- Subtotals: By product
- Freeze: Row 5
- File: `Production Volume Report - {period_start} to {period_end}.xlsx`

## Notes
- Supports multi-product wells (oil, gas, NGL, water)
- Net volume adjusted for royalty take and company interest percentage
- Disposition field tracks sales, disposal, or other use
