---
name: revenue-ar
description: >
  Revenue-side accounts receivable showing amounts owed to the company from
  purchasers for production sales. Tracks outstanding invoices, aging buckets,
  and collections status to support cash forecasting and receivables management.
version: 0.1.0
---

# Revenue AR

## Overview
This skill reports company accounts receivable from purchasers, providing aging analysis and outstanding balance visibility for revenue-side operations.

## Gold Model
**Status:** Pending build
**Expected table:** `gold_fct_revenue_ar` in `GOLD_FINANCIAL`

## Input Parameters
- `as_of_date` **(required)**: AR snapshot date (YYYY-MM-DD)
- `company_code` (optional): Default '200'
- `purchaser_code` (optional): Filter to specific purchaser

## Output Columns
- Company
- Purchaser Code
- Purchaser Name
- Well Code
- Well Name
- Product
- Production Period
- Invoice Amount
- Paid Amount
- Outstanding Balance
- Aging Bucket

## Aging Buckets
- Current (0-30 days)
- 31-60 days
- 61-90 days
- 91-120 days
- 120+ days

## Excel Output
- Tab: "Revenue AR"
- Grouping: By purchaser
- Columns: Aging bucket breakdown
- Grand Total: Included
- Freeze: Row 5
- File: `Revenue AR - {as_of_date}.xlsx`

## Notes
- Gold model not yet built; requires join of invoice, payment, and production date tables
- Aging calculated as of_date minus invoice/production date
- Supports collection management and cash flow forecasting
