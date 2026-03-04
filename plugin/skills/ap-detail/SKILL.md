---
name: ap-detail
description: >
  Generates ODA Report 340 — AP Detail Report. Shows "invoice-level AP detail with vendor invoices, amounts, and payment status" for comprehensive accounts payable analysis.
version: 0.1.0
---

## Overview
The AP Detail Report (ODA Report 340) displays invoice-level accounts payable transactions, including invoice amounts, paid amounts, remaining balances, and payment status. Use this skill to track individual vendor invoices, monitor payment schedules, and identify outstanding payables.

## Data Source
**Gold Model**: `gold_fct_ap_detail` (pending promotion from staging)
**Staging Models** (interim): `stg_oda__apinvoicedetail` + `stg_oda__apinvoice`
**Database**: `FO_PRODUCTION_DB.GOLD_FINANCIAL` (Snowflake)

## Status Notice
⚠️ **Gold Model Pending**: This skill will be fully operational once `gold_fct_ap_detail` is promoted from staging in the analytics repository. Current implementation uses staging tables as a temporary solution. Expected promotion timeline: Q2 2026.

## Required Input Parameters

- **period_start** (required): First day of reporting period (YYYY-MM-DD)
- **period_end** (required): Last day of reporting period (YYYY-MM-DD)
- **company_code** (optional, default: 200): Formentera Operations LLC company code
- **vendor_code** (optional): Filter to specific vendor; leave blank for all vendors

## Expected Output Columns

| Column | Description |
|--------|-------------|
| Company Code | Formentera company identifier |
| Company Name | Legal entity name |
| Vendor Code | GL vendor/entity code |
| Vendor Name | Vendor legal name |
| Invoice # | Vendor invoice number |
| Invoice Date | Date invoice was received/recorded |
| Due Date | Payment due date per terms |
| GL Account | GL account code (e.g., 5000-1200) |
| Description | Invoice line item description |
| Invoice Amount | Total invoice amount due |
| Paid Amount | Amount paid to date |
| Balance | Outstanding balance (Invoice Amount - Paid Amount) |
| Payment Status | PAID, PARTIAL, PENDING, or OVERDUE |

## Query Pattern (Expected Structure)

```sql
SELECT
  company_code,
  company_name,
  vendor_code,
  vendor_name,
  invoice_number,
  invoice_date,
  due_date,
  gl_account,
  line_description,
  invoice_amount,
  paid_amount,
  (invoice_amount - paid_amount) AS balance,
  CASE
    WHEN (invoice_amount - paid_amount) = 0 THEN 'PAID'
    WHEN (invoice_amount - paid_amount) < invoice_amount AND (invoice_amount - paid_amount) > 0 THEN 'PARTIAL'
    WHEN CURRENT_DATE > due_date AND (invoice_amount - paid_amount) > 0 THEN 'OVERDUE'
    ELSE 'PENDING'
  END AS payment_status
FROM gold_fct_ap_detail
WHERE invoice_date >= :period_start
  AND invoice_date <= :period_end
  AND company_code = :company_code
  AND (:vendor_code IS NULL OR vendor_code = :vendor_code)
ORDER BY vendor_name, invoice_date, invoice_number;
```

## Excel Output Format

**File Name**: `AP Invoice Detail - {period}.xlsx`
**Sheet Name**: "AP Invoice Detail"

Formatting:
- **Subtotals by Vendor**: Light blue background with SUM formulas for invoice, paid, and balance amounts
- **Grand Total Row**: Dark blue background with white bold text
- **Freeze Panes**: Freeze at Row 5 (headers + company summary row)
- **Currency**: Format all dollar columns as currency with 2 decimal places
- **Number Format**: Invoice numbers as text; dates as MM/DD/YYYY
- **Status Colors**:
  - PAID = Green background
  - PARTIAL = Yellow background
  - PENDING = White background
  - OVERDUE = Red background with white text

## Edge Cases & Validation

1. **No invoices in period**: Output header row and grand total of $0.00
2. **Multi-line invoices**: Display one row per line item; subtotal by invoice number
3. **Negative amounts**: Indicate credit memos or adjustments; flag for review
4. **Null due dates**: Investigate invoice terms; default to invoice_date + 30 days
5. **Overpayments**: Display negative balance; flag as potential duplicate payment
6. **Partial payments**: Calculate balance as invoice_amount - sum(paid_amount) across all receipts

## Example Usage

```
Period: 2026-02-01 to 2026-02-28
Company: Formentera Operations LLC (200)
Vendor Filter: None
```

Expected output: All vendor invoices issued in February with payment status and outstanding balances.

## Implementation Notes

- **Current Status**: Interim implementation uses staging tables pending gold model promotion
- **Next Steps**: Once `gold_fct_ap_detail` is available in GOLD schema, update query to point to gold model
- **Grain**: One row per AP invoice line item (matches ODA Report 340 specification)
- **Payment Tracking**: Cross-reference with `gold_dim_ap_check_register` for payment date confirmation
