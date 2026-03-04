---
name: owner-revenue-detail
description: >
  Line-item revenue distributions to owners by well, product, and production
  period. Provides detailed visibility into mineral and working interest owner
  payments with full accounting details including taxes, deductions, and
  suspense reconciliation.
version: 0.1.0
---

# Owner Revenue Detail

## Overview
This skill delivers comprehensive owner revenue distributions at the transaction level, showing all accounting elements: net value, interest allocation, taxes, deductions, paid amounts, and suspense tracking.

## Gold Model
**Status:** In progress
**Source table:** `gold_fct_owner_revenue_detail` in `GOLD_FINANCIAL`

## Schema Reference
Key columns in source model:
- id, owner_revenue_detail_sk
- company_code, owner_id, owner_code, owner_name
- fid, well_code, well_name
- production_date, production_year, production_month
- product_code, product_name, product_full_name
- decimal_interest, interest_type_full_name
- net_volume, net_value, paid_amount
- total_tax, net_deductions
- amount_suspended, netted_amount, balance_amount
- item_suspense, owner_suspense, well_suspense

## Input Parameters
- `period_start` **(required)**: Production period start (YYYY-MM-DD)
- `period_end` **(required)**: Production period end (YYYY-MM-DD)
- `company_code` (optional): Default '200'
- `owner_code` (optional): Filter to specific owner
- `well_code` (optional): Filter to specific well

## Output Columns
- Company
- Owner Code
- Owner Name
- Well Code
- Well Name
- Production Date
- Product
- Interest Type
- Decimal Interest
- Net Volume
- Net Value
- Taxes
- Deductions
- Paid Amount
- Suspended
- Netted
- Balance

## Excel Output
- Tab: "Owner Revenue Detail"
- Grouping: By owner and well
- Subtotals: By product
- Grand Total: Included
- Freeze: Row 5
- File: `Owner Revenue Detail - {period_start} to {period_end}.xlsx`

## Notes
- Excludes redistributed items (payment_status_id = 8) at model build time
- Detailed reconciliation of all accounting adjustments
- Balance field tracks unresolved suspense or payment variances
