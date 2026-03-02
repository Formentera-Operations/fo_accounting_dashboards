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

**CRITICAL: Point-in-time aging** — `gold_fct_ar_aging_summary` stores aging bucket columns
(`balance_90_plus_days`, etc.) using `current_date()` at model build time. For historical
or month-end reports, do NOT use these columns. Instead, recalculate inline using
`DATEDIFF('day', invoice_date, :as_of_date)` — see validated query pattern below.

| ODA Column | Gold Model Column | Model | Notes |
|------------|------------------|-------|-------|
| Company Code | `company_code` | `gold_fct_ar_aging_summary` | |
| Owner Code | `owner_code` | `gold_fct_ar_aging_summary` | |
| Owner Name | `owner_name` | `gold_fct_ar_aging_summary` | |
| Hold Billing | `hold_billing` | `gold_fct_ar_aging_summary` | boolean — MAX() per owner |
| Over 90 Days | `DATEDIFF > 90` | `gold_fct_ar_aging_summary` | inline calc, NOT model column |
| 90-61 Days | `DATEDIFF BETWEEN 61 AND 90` | `gold_fct_ar_aging_summary` | inline calc |
| 60-31 Days | `DATEDIFF BETWEEN 31 AND 60` | `gold_fct_ar_aging_summary` | inline calc |
| 30 Days-Current | `DATEDIFF BETWEEN 0 AND 30` | `gold_fct_ar_aging_summary` | inline calc — ODA combines current+1-30 |
| Total Outstanding | `remaining_balance` | `gold_fct_ar_aging_summary` | summed by owner |
| DEC NETTING | `net_amount` | `gold_fct_gl_details` | join `entity_code = owner_code`; filter main_account IN ('501','130'), gl_description LIKE '%Net Revenue Against A/R%' OR '%AR Cross Clear%' |
| DEC REV PMT | `check_amount` | `gold_dim_revenue_check_register` | join `entity_code = owner_code`; filter `voided = 'NO'`; WARNING: includes all System Checks — see note below |
| REV SUSPENSE | `amount_suspended` | `gold_fct_owner_revenue_detail` | SUM where amount_suspended > 0 |
| JIB PMTS | `balance_due` | `gold_fct_ar_aging_detail` | join `owner_code`; filter `transaction_source IN ('payment','netting')` and JIB cycle date range |
| [Month] Comments | — | — | user-editable — export as blank columns |

### Validated Query Parameters (confirmed against Jan 2026 reference file)

| Parameter | Value | Notes |
|-----------|-------|-------|
| `as_of_date` | Last day of report month | e.g. `2026-01-31` for January report |
| `period_start` | First day of prior month | e.g. `2025-12-01` for December activity |
| `period_end` | Last day of prior month | e.g. `2025-12-31` |
| `jib_cycle_start` | JIB billing cycle start | From JIB header, e.g. `2025-11-19` |
| `jib_cycle_end` | JIB billing cycle end | From JIB header, e.g. `2025-12-17` |

### Join Key

`gold_fct_ar_aging_summary.owner_code` = `gold_fct_gl_details.entity_code` = `gold_dim_revenue_check_register.entity_code`

### Known Issue: Revenue Check Register WI Exclusion

The ODA AR Summary "DEC REV PMT" column appears to exclude System Checks issued to
Working Interest (WI) owners. When Britanco LLC (a WI owner) received a $94,312
System Check in December 2025, the reference file showed $0 — suggesting ODA filters
to royalty/ORRI owner revenue checks only. Pending investigation: may need to add
payment type or owner interest-type filter to the revenue check register join.

### Point-in-Time Limitation

The gold model stores only the **current** `remaining_balance`. Invoices paid after the
report date but before the model's last refresh will show `remaining_balance = 0` and
will NOT appear in the query — even though they were outstanding on the report date.
This means historical AR snapshots will always show lower OVER_90 balances than the
original report. This is expected and cannot be corrected without a history table.

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

**Source model:** `FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_FCT_GL_DETAILS`
No dedicated gold model needed — query pattern below is sufficient for skill use.

### Column Mapping

| ODA Column | `gold_fct_gl_details` Column | Notes |
|------------|------------------------------|-------|
| Main | `main_account` | e.g. 501, 130 |
| Sub | `sub_account` | e.g. 1, 2 |
| Name | `account_name` | e.g. REVENUE PAYABLE, A/R JIB |
| Number (Voucher) | `voucher_code` | cross-clear voucher |
| Entity Type | `entity_type` | owner, vendor, well, etc. |
| Code | `entity_code` | owner/entity code |
| Location / Name | `entity_name` | owner/entity name |
| Date | `journal_date` | transaction date |
| Accrual Date | `accrual_date` | accounting period date |
| Description | `gl_description` | e.g. "Net Revenue Against A/R" |
| Amount | `net_amount` | debits positive, credits negative |

### Standard Query Pattern

```sql
SELECT
    main_account,
    sub_account,
    account_name,
    voucher_code,
    entity_type,
    entity_code,
    entity_name,
    journal_date,
    accrual_date,
    gl_description,
    net_amount
FROM FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_FCT_GL_DETAILS
WHERE main_account IN ('501', '130')
  AND sub_account IN ('1', '2', '3', '4')
  AND (
    gl_description LIKE '%Net Revenue Against A/R%'
    OR gl_description LIKE '%AR Cross Clear%'
  )
ORDER BY voucher_code, main_account
```

**Date filter:** Add `AND journal_date BETWEEN '{period_start}' AND '{period_end}'`
for period-specific reports.

**Pairing logic:** Each voucher produces two rows that net to zero — one debit (501.1)
and one credit (130.2). Group by `voucher_code` to see matched pairs.

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
The gold model pre-computes bucket columns using `current_date()` at build time, which
makes them **wrong for any historical/month-end report**. Always recalculate inline.

| ODA Bucket Label | Inline Recalculation | Gold Model Column (current only) |
|-----------------|---------------------|----------------------------------|
| 30 Days-Current | `DATEDIFF('day', invoice_date, :as_of_date) BETWEEN 0 AND 30` | `current_balance + balance_1_30_days` |
| 60-31 Days | `DATEDIFF('day', invoice_date, :as_of_date) BETWEEN 31 AND 60` | `balance_31_60_days` |
| 90-61 Days | `DATEDIFF('day', invoice_date, :as_of_date) BETWEEN 61 AND 90` | `balance_61_90_days` |
| Over 90 Days | `DATEDIFF('day', invoice_date, :as_of_date) > 90` | `balance_90_plus_days` |
| Total Outstanding | `SUM(remaining_balance)` | `remaining_balance` |

**Rule:** Use inline recalculation for every AR report. The pre-computed columns are
only accurate when the gold model was built on the same day as the report date.

## Validated AR Summary Query Pattern

```sql
WITH params AS (
    SELECT
        '2026-01-31'::DATE   AS as_of_date,     -- last day of report month
        '2025-12-01'::DATE   AS period_start,   -- first day of prior month (DEC payments)
        '2025-12-31'::DATE   AS period_end,     -- last day of prior month
        '2025-11-19'::DATE   AS jib_cycle_start, -- from JIB header
        '2025-12-17'::DATE   AS jib_cycle_end    -- from JIB header
),
ar_base AS (
    SELECT
        s.company_code, s.owner_code, s.owner_name,
        MAX(CASE WHEN s.hold_billing THEN 1 ELSE 0 END)                                    AS hold_billing,
        SUM(CASE WHEN DATEDIFF('day', s.invoice_date, p.as_of_date) > 90
                 THEN s.remaining_balance ELSE 0 END)                                      AS over_90,
        SUM(CASE WHEN DATEDIFF('day', s.invoice_date, p.as_of_date) BETWEEN 61 AND 90
                 THEN s.remaining_balance ELSE 0 END)                                      AS days_61_90,
        SUM(CASE WHEN DATEDIFF('day', s.invoice_date, p.as_of_date) BETWEEN 31 AND 60
                 THEN s.remaining_balance ELSE 0 END)                                      AS days_31_60,
        SUM(CASE WHEN DATEDIFF('day', s.invoice_date, p.as_of_date) BETWEEN 0 AND 30
                 THEN s.remaining_balance ELSE 0 END)                                      AS days_current_30,
        SUM(s.remaining_balance)                                                           AS total_outstanding
    FROM FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_FCT_AR_AGING_SUMMARY s
    CROSS JOIN params p
    WHERE s.include_record = 1 AND s.company_code = '200'
      AND s.invoice_date <= p.as_of_date
    GROUP BY 1, 2, 3
    HAVING SUM(s.remaining_balance) <> 0
),
netting AS (
    SELECT g.entity_code, SUM(g.net_amount) AS net_amount
    FROM FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_FCT_GL_DETAILS g
    CROSS JOIN params p
    WHERE g.main_account IN ('501','130') AND g.sub_account IN ('1','2','3','4')
      AND (g.gl_description LIKE '%Net Revenue Against A/R%' OR g.gl_description LIKE '%AR Cross Clear%')
      AND g.journal_date >= p.period_start AND g.journal_date <= p.period_end
    GROUP BY 1
),
rev_pmts AS (
    SELECT r.entity_code, SUM(r.check_amount) AS check_amount
    FROM FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_DIM_REVENUE_CHECK_REGISTER r
    CROSS JOIN params p
    WHERE r.check_date >= p.period_start AND r.check_date <= p.period_end
      AND r.voided = 'NO' AND r.company_code = '200'
    GROUP BY 1
),
suspense AS (
    SELECT o.owner_code, SUM(o.amount_suspended) AS amount_suspended
    FROM FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_FCT_OWNER_REVENUE_DETAIL o
    CROSS JOIN params p
    WHERE o.amount_suspended > 0 AND o.company_code = '200'
      AND o.production_date <= p.as_of_date
    GROUP BY 1
),
jib_pmts AS (
    SELECT d.owner_code, SUM(d.balance_due) AS jib_payment_amount
    FROM FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_FCT_AR_AGING_DETAIL d
    CROSS JOIN params p
    WHERE d.company_code = '200'
      AND d.transaction_source IN ('payment','netting')
      AND d.transaction_date >= p.jib_cycle_start
      AND d.transaction_date <= p.jib_cycle_end
    GROUP BY 1
)
SELECT ar.*,
       COALESCE(n.net_amount,0)          AS dec_netting,
       COALESCE(rp.check_amount,0)       AS dec_rev_pmt,
       COALESCE(s.amount_suspended,0)    AS rev_suspense,
       COALESCE(jp.jib_payment_amount,0) AS jib_pmts
FROM ar_base ar
LEFT JOIN netting  n  ON ar.owner_code = n.entity_code
LEFT JOIN rev_pmts rp ON ar.owner_code = rp.entity_code
LEFT JOIN suspense s  ON ar.owner_code = s.owner_code
LEFT JOIN jib_pmts jp ON ar.owner_code = jp.owner_code
ORDER BY ar.owner_name
```
