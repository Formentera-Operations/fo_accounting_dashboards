---
name: purchaser-receipt-history
description: >
  Shows payments received from purchasers (oil/gas buyers) for production sales.
  Used to verify revenue receipts and reconcile cash received against production
  volumes and invoiced amounts.
version: 0.1.0
---

# Purchaser Receipt History

## Overview
This skill reports cash receipts from purchasers, providing visibility into payment timelines and reconciliation against production volumes and invoiced amounts.

## Gold Model
**Status:** Staging only
**Source tables:** `stg_oda__checkrevenue`, `stg_oda__purchaser_v2`
**Expected gold:** `gold_fct_purchaser_receipts` in `GOLD_FINANCIAL`
**Dimension:** `gold_dim_purchaser` in `GOLD_MARKETING`

## Input Parameters
- `period_start` **(required)**: Start date of receipt period (YYYY-MM-DD)
- `period_end` **(required)**: End date of receipt period (YYYY-MM-DD)
- `company_code` (optional): Default '200'
- `purchaser_code` (optional): Filter to specific purchaser

## Output Columns
- Company
- Purchaser Code
- Purchaser Name
- Receipt Date
- Check #
- Well Code
- Well Name
- Product
- Volume
- Price
- Gross Amount
- Taxes
- Net Amount

## Excel Output
- Tab: "Purchaser Receipt History"
- Grouping: By purchaser and product
- Subtotals: By product
- Freeze: Row 5
- File: `Purchaser Receipt History - {period_start} to {period_end}.xlsx`

## Notes
- Gold model pending; currently sourced from staging tables
- Reconciles cash receipts with production metrics
