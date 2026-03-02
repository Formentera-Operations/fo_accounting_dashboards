# AR Aging — Field Mapping: ODA Report Columns → Gold Models

Source: `AR Aging Reports January 2026.xlsx` (reference file in this folder)

The Excel file contains 5 report tabs. This document maps each ODA column to its
corresponding gold model column in `FO_PRODUCTION_DB`.

---

## Sheet: AR Invoice (ODA Report 640 — AR Detail by Invoice)

Rows 1–5 are ODA filter headers (Company, Owner, date range). Data starts at row 6.

| ODA Column | Gold Model Column | Model | Notes |
|------------|------------------|-------|-------|
| Company Code | `company_code` | `gold_fct_ar_aging_summary` | |
| Owner Code | `owner_code` | `gold_fct_ar_aging_summary` | |
| Owner Name | `owner_name` | `gold_fct_ar_aging_summary` | |
| Invoice Code | `invoice_number` | `gold_fct_ar_aging_summary` | |
| Invoice Date | `invoice_date` | `gold_fct_ar_aging_summary` | |
| Hold Billing | `hold_billing` | `gold_fct_ar_aging_summary` | boolean |
| Invoice Amount | `total_invoice_amount` | `gold_fct_ar_aging_summary` | |
| Over 90 Days | `balance_90_plus_days` | `gold_fct_ar_aging_summary` | |
| 90-61 Days | `balance_61_90_days` | `gold_fct_ar_aging_summary` | |
| 60-31 Days | `balance_31_60_days` | `gold_fct_ar_aging_summary` | |
| 30 Days-Current | `current_balance` + `balance_1_30_days` | `gold_fct_ar_aging_summary` | ODA combines current + 1-30 into one bucket |
| Total Outstanding | `remaining_balance` | `gold_fct_ar_aging_summary` | |

**Standard filter for this report:** `WHERE include_record = 1`

**Bucket note:** ODA's "30 Days-Current" maps to two gold model columns:
- `current_balance` (days_past_due <= 0)
- `balance_1_30_days` (1-30 days past due)

When replicating this report, sum both: `current_balance + balance_1_30_days AS "30 Days-Current"`

---

## Sheet: AR Invoice Payment Details (ODA Report ARR — AR Summary by Owner)

| ODA Column | Gold Model Column | Model | Notes |
|------------|------------------|-------|-------|
| Owner | `owner_code` | `gold_fct_ar_aging_summary` | |
| Owner Name | `owner_name` | `gold_fct_ar_aging_summary` | |
| Total Original Amounts | `total_invoice_amount` | `gold_fct_ar_aging_summary` | aggregated |
| Total Payments | derived from `gold_fct_ar_aging_detail` | `gold_fct_ar_aging_detail` | filter `transaction_source = 'payment'` |
| Total Adjustments | derived from `gold_fct_ar_aging_detail` | `gold_fct_ar_aging_detail` | filter `transaction_source = 'adjustment'` |
| Total Nettings | derived from `gold_fct_ar_aging_detail` | `gold_fct_ar_aging_detail` | filter `transaction_source = 'netting'` |
| Balance Due | `remaining_balance` | `gold_fct_ar_aging_summary` | aggregated by owner |

**Standard filter:** `WHERE include_record = 1`

---

## Sheet: AR Summary (Custom Team Report)

This tab is NOT a direct ODA export — it is a custom pivot built by the accounting team
combining AR aging data with commentary columns. It includes team-added columns:
- Month-over-month comment columns (Sept, Oct, Nov, Dec, Jan Comments)
- Netting, revenue payment, and revenue suspense rollups by owner

**Replication approach:** Generate the core aging columns from `gold_fct_ar_aging_summary`
and append comment columns as blank/user-editable columns in the Excel export.

| ODA Column | Gold Model Column | Model | Notes |
|------------|------------------|-------|-------|
| Company Code | `company_code` | `gold_fct_ar_aging_summary` | |
| Owner Code | `owner_code` | `gold_fct_ar_aging_summary` | |
| Owner Name | `owner_name` | `gold_fct_ar_aging_summary` | |
| Hold Billing | `hold_billing` | `gold_fct_ar_aging_summary` | |
| Over 90 Days | `balance_90_plus_days` | `gold_fct_ar_aging_summary` | summed by owner |
| 90-61 Days | `balance_61_90_days` | `gold_fct_ar_aging_summary` | summed by owner |
| 60-31 Days | `balance_31_60_days` | `gold_fct_ar_aging_summary` | summed by owner |
| 30 Days-Current | `current_balance + balance_1_30_days` | `gold_fct_ar_aging_summary` | summed by owner |
| Total Outstanding | `remaining_balance` | `gold_fct_ar_aging_summary` | summed by owner |
| DEC NETTING | `netted_amount` | `gold_fct_owner_revenue_detail` | join by owner, filter by period |
| DEC REV PMT | `paid_amount` | `gold_fct_owner_revenue_detail` | join by owner, filter by period |
| REV SUSPENSE | `amount_suspended` | `gold_fct_owner_revenue_detail` | join by owner |
| JIB PMTS | from `gold_fct_jib` | `gold_fct_jib` | join by owner, filter by date range |
| [Month] Comments | — | — | user-editable — export as blank columns |

---

## Sheet: RCKR - Brief Report (ODA Report 430 — Revenue Check Register)

| ODA Column | Gold Model Column | Model | Notes |
|------------|------------------|-------|-------|
| Company Code | `company_code` | `gold_dim_revenue_check_register` | |
| Company Name | `company_name` | `gold_dim_revenue_check_register` | |
| Check # | `check_number` | `gold_dim_revenue_check_register` | |
| Owner Code | `owner_code` | `gold_dim_revenue_check_register` | |
| Owner Name | `owner_name` | `gold_dim_revenue_check_register` | |
| Voucher # | `voucher_number` | `gold_dim_revenue_check_register` | |
| Check Date | `check_date` | `gold_dim_revenue_check_register` | |
| Check Type | `check_type_name` | `gold_dim_revenue_check_register` | |
| Check Amount | `check_amount` | `gold_dim_revenue_check_register` | |
| Voided | `voided` | `gold_dim_revenue_check_register` | `YES` / blank |
| Reconciled | `reconciled` | `gold_dim_revenue_check_register` | `YES` / blank |

---

## Sheet: ARCrossClear (AR Cross-Clear)

This report shows GL journal entries that net Revenue Payable (501.1) against AR JIB (130.2).
Each cross-clear produces two balanced rows (debit + credit) that net to zero per voucher.

**No dedicated gold model exists yet** — needs to be built from GL source data.
Candidate sources: `stg_oda__gl`, `int_oda_gl`

| ODA Column | Likely Source Column | Notes |
|------------|---------------------|-------|
| Main | GL main account code | e.g. 501, 130 |
| Sub | GL sub account code | e.g. 1, 2 |
| Name | GL account name | e.g. REVENUE PAYABLE, A/R JIB |
| Number (1st) | Voucher number | cross-clear voucher |
| Number (2nd) | Check/reference number | often blank |
| Date (1st) | Transaction date | |
| Date (2nd) | Accounting period | e.g. "December 2025" |
| Code | Owner/entity code | |
| Location | Well or entity location | |
| (Description) | Transaction description | e.g. "Net Revenue Against A/R" |
| Amount | Transaction amount | debits positive, credits negative |

**Build note:** This is a ❌ net-new gold model. Filter GL for accounts 501.1 and 130.2
and vouchers where the transaction description contains cross-clear entries.

---

## Sheet: Suspense Report (ODA Report 440 — Revenue Suspense)

This tab maps directly to `gold_fct_owner_revenue_detail` filtered to suspended items.

| ODA Column | Gold Model Column | Notes |
|------------|------------------|-------|
| Company Code | `company_code` | |
| Owner Code | `owner_code` | |
| Owner Name | `owner_name` | |
| Well Code | `well_code` | |
| Well Name | `well_name` | |
| Net Volume | `net_volume` | |
| Net Value | `net_value` | |
| Total Tax | `total_tax` | |
| Net Deductions | `net_deductions` | |
| Gross Deductions | `gross_deductions` | |
| Amount Suspended | `amount_suspended` | |
| Netted Amount | `netted_amount` | |
| Balance Amount | `balance_amount` | |

**Standard filter:** `WHERE amount_suspended > 0`

---

## Key Gotcha: ODA Aging Bucket vs. Gold Model Buckets

ODA collapses "current" and "1-30 days" into a single "30 Days-Current" column.
The gold model keeps them separate for flexibility. When replicating the ODA format,
always combine: `current_balance + balance_1_30_days`.

| ODA Bucket Label | Gold Model Column(s) |
|-----------------|----------------------|
| 30 Days-Current | `current_balance` + `balance_1_30_days` |
| 60-31 Days | `balance_31_60_days` |
| 90-61 Days | `balance_61_90_days` |
| Over 90 Days | `balance_90_plus_days` |
| Total Outstanding | `remaining_balance` |
