---
name: ap-summary
description: >
  Generates ODA Report 350 — AP Summary Report. Shows "vendor-level accounts payable summary with total invoices, paid amounts, and aging buckets" for payables analysis and cash planning.
version: 0.1.0
---

## Overview
The AP Summary Report (ODA Report 350) provides a high-level vendor-level view of accounts payable, including total invoiced amounts, payments made, outstanding balances, and aging analysis by vendor. Use this skill for cash flow forecasting, vendor performance analysis, and working capital management.

## Data Source
**Gold Model**: `gold_fct_ap_summary` (pending promotion from staging)
**Staging Model** (interim): `stg_oda__apinvoice`
**Database**: `FO_PRODUCTION_DB.GOLD_FINANCIAL` (Snowflake)

## Status Notice
⚠️ **Gold Model Pending**: This skill will be fully operational once `gold_fct_ap_summary` is promoted from staging in the analytics repository. Current implementation uses staging tables as a temporary solution. Expected promotion timeline: Q2 2026.

## Required Input Parameters

- **as_of_date** or **period** (required): Report date (YYYY-MM-DD) or period range (YYYY-MM-DD to YYYY-MM-DD)
- **company_code** (optional, default: 200): Formentera Operations LLC company code

## Expected Output Columns

| Column | Description |
|--------|-------------|
| Company Code | Formentera company identifier |
| Company Name | Legal entity name |
| Vendor Code | GL vendor/entity code |
| Vendor Name | Vendor legal name |
| Invoice Count | Total invoices from vendor in period |
| Total Invoiced | Sum of all invoice amounts |
| Total Paid | Sum of all payments |
| Outstanding Balance | Total Invoiced - Total Paid |
| Current (0-30 days) | Balance on invoices due within 30 days |
| 30+ Days | Balance on invoices due 31-60 days ago |
| 60+ Days | Balance on invoices due 61-90 days ago |
| 90+ Days | Balance on invoices due more than 90 days ago |

## Query Pattern (Expected Structure)

```sql
SELECT
  company_code,
  company_name,
  vendor_code,
  vendor_name,
  COUNT(DISTINCT invoice_number) AS invoice_count,
  SUM(invoice_amount) AS total_invoiced,
  SUM(paid_amount) AS total_paid,
  (SUM(invoice_amount) - SUM(paid_amount)) AS outstanding_balance,
  SUM(CASE WHEN DATEDIFF(day, due_date, :as_of_date) <= 30 THEN (invoice_amount - paid_amount) ELSE 0 END) AS current_0_30,
  SUM(CASE WHEN DATEDIFF(day, due_date, :as_of_date) BETWEEN 31 AND 60 THEN (invoice_amount - paid_amount) ELSE 0 END) AS days_30_60,
  SUM(CASE WHEN DATEDIFF(day, due_date, :as_of_date) BETWEEN 61 AND 90 THEN (invoice_amount - paid_amount) ELSE 0 END) AS days_60_90,
  SUM(CASE WHEN DATEDIFF(day, due_date, :as_of_date) > 90 THEN (invoice_amount - paid_amount) ELSE 0 END) AS days_90_plus
FROM gold_fct_ap_summary
WHERE company_code = :company_code
  AND invoice_date <= :as_of_date
GROUP BY company_code, company_name, vendor_code, vendor_name
ORDER BY outstanding_balance DESC, vendor_name;
```

## Excel Output Format

**File Name**: `AP Summary - {as_of_date}.xlsx`
**Sheet Name**: "AP Summary"

Formatting:
- **Subtotals by Vendor**: Light blue background with SUM formulas
- **Grand Total Row**: Dark blue background with white bold text, summing all columns
- **Freeze Panes**: Freeze at Row 5 (headers + company summary row)
- **Currency**: Format all dollar columns as currency with 2 decimal places
- **Number Format**: Dates as MM/DD/YYYY; invoice counts as whole numbers
- **Aging Bucket Colors**:
  - Current (0-30): Green background
  - 30-60 days: Yellow background
  - 60-90 days: Orange background
  - 90+ days: Red background with white text
- **Conditional Formatting**: Highlight vendors with 90+ day balances > $50K in bold red

## Edge Cases & Validation

1. **No vendors in period**: Output header row and grand total of $0.00
2. **Negative outstanding balance**: Indicates overpayment or credit; flag for investigation
3. **Null due dates**: Treat as invoice_date + 30 days for aging calculation
4. **Large 90+ day balance**: Escalate to accounting manager; may indicate dispute or withholding
5. **Invoice count = 0**: Vendor has no activity; remove from report unless requested
6. **Payment future-dated**: May not be reflected in paid amount yet; note in aging analysis

## Example Usage

```
As of Date: 2026-02-28
Company: Formentera Operations LLC (200)
```

Expected output: All vendors with outstanding AP as of Feb 28, 2026, with aging breakdown. Example:
- ABC Supply: $50,000 outstanding (Current: $20K, 30-60: $15K, 60-90: $10K, 90+: $5K)
- XYZ Services: $35,000 outstanding (Current: $35K)

## Implementation Notes

- **Current Status**: Interim implementation uses staging tables pending gold model promotion
- **Next Steps**: Once `gold_fct_ap_summary` is available in GOLD schema, update query to point to gold model
- **Grain**: One row per vendor per reporting period
- **Aging Analysis**: Days calculated from due_date to as_of_date (or report date if as_of_date not provided)
- **Cash Planning**: Use outstanding_balance and aging buckets for 13-week cash flow forecast
