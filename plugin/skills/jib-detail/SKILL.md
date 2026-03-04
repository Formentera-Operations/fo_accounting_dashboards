---
name: jib-detail
description: "JIB detail report — line-item Joint Interest Billing charges by account, well, and owner. Use for partner charge breakdowns, AFE cost review, or account-level JIB analysis."
---

# JIB Detail

Line-item detail of JIB charges by account, well, and owner from `FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_FCT_JIB`.

## Input Parameters

Gather from the user:
- `period_start`: Start date of reporting period (YYYY-MM-DD, required)
- `period_end`: End date of reporting period (YYYY-MM-DD, required)
- `company_code`: Ask per accounting-assistant instructions
- `owner_codes`: Optional, filter to specific owners (comma-separated codes)
- `well_code`: Optional, filter to a specific well
- `afe_code`: Optional, filter to a specific AFE

For period interpretation: "January 2026" means `period_start = 2026-01-01` and `period_end = 2026-01-31`.

## Default Filters

Always apply unless the user explicitly overrides:

| Filter | Value | Reason |
|--------|-------|--------|
| `accrual_date` | `BETWEEN :period_start AND :period_end` | Reporting period |
| `company_code` | `= :company_code` | Company scope |

## Query

### Base (no AR supplement)

```sql
SELECT
    company_code,
    company_name,
    owner_code,
    owner_name,
    well_code,
    well_name,
    eid,
    afe_code,
    afe_name,
    afe_type_code,
    main_account,
    sub_account,
    account_name,
    los_category,
    los_section,
    accrual_date,
    billed_date,
    description,
    reference,
    gross_value,
    expense_deck_interest,
    net_value
FROM FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_FCT_JIB
WHERE company_code = :company_code
  AND accrual_date BETWEEN :period_start AND :period_end
ORDER BY owner_name, well_code, main_account, sub_account
```

Add optional filters before ORDER BY:
- `AND owner_code IN (:owner_codes)`
- `AND well_code = :well_code`
- `AND afe_code = :afe_code`

### With AR Payment Status (optional supplement)

If the user asks which invoices have been paid or are outstanding, LEFT JOIN to `gold_fct_ar_aging_detail` on `ar_invoice_id`. Filter that model to `transaction_source = 'invoice'` to get one row per invoice (the detail model has multiple rows per invoice — one per transaction type).

```sql
SELECT
    j.company_code,
    j.company_name,
    j.owner_code,
    j.owner_name,
    j.well_code,
    j.well_name,
    j.eid,
    j.afe_code,
    j.afe_name,
    j.afe_type_code,
    j.main_account,
    j.sub_account,
    j.account_name,
    j.los_category,
    j.los_section,
    j.accrual_date,
    j.billed_date,
    j.description,
    j.reference,
    j.gross_value,
    j.expense_deck_interest,
    j.net_value,
    ar.invoice_number,
    ar.voucher_number,
    ar.remaining_balance        AS ar_remaining_balance,
    ar.is_invoice_posted,
    CASE
        WHEN j.ar_invoice_id IS NULL        THEN 'No Invoice/Accrual'
        WHEN ar.remaining_balance = 0       THEN 'Paid'
        WHEN ar.remaining_balance < j.net_value THEN 'Partially Paid'
        ELSE                                     'Outstanding'
    END AS payment_status
FROM FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_FCT_JIB j
LEFT JOIN FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_FCT_AR_AGING_DETAIL ar
    ON ar.invoice_id = j.ar_invoice_id
    AND ar.transaction_source = 'invoice'
WHERE j.company_code = :company_code
  AND j.accrual_date BETWEEN :period_start AND :period_end
ORDER BY j.owner_name, j.well_code, j.main_account, j.sub_account
```

## Output Columns

### Base
Company Code, Company Name, Owner Code, Owner Name, Well Code, Well Name, EID, AFE Code, AFE Name, AFE Type, Main Account, Sub Account, Account Name, LOS Category, LOS Section, Accrual Date, Billed Date, Description, Reference, Gross Value, Owner Interest, Net Value

### With AR Supplement
All base columns plus: Invoice Number, Voucher Number, AR Remaining Balance, Is Invoice Posted, Payment Status

## Excel Output Format

- Filename: `JIB Detail - {period_start} to {period_end}.xlsx`
- Tab: "JIB Detail"
- Header: Dark blue background, white bold text
- Grouping: By owner, then by well, then by account
- All amount columns: Currency formatted (`$#,##0.00`)
- Grand total row: Dark blue background, white bold text
- Freeze panes: Row 2

## Edge Cases

- `accrual_date` is the business period date; `billed_date` is when the invoice was issued — use `accrual_date` for period filtering
- `expense_deck_interest` is the owner's decimal working interest share (e.g., 0.25 = 25%)
- `afe_code` / `afe_name` may be null for overhead and non-AFE charges
- `los_category` / `los_section` classify GL accounts for lease operating statement reporting
- `ar_invoice_id` is null for JIB lines not yet invoiced (e.g., accruals, pre-billing entries) — these show `payment_status = 'No Invoice/Accrual'` in the AR supplement
- `remaining_balance` in the AR supplement is point-in-time as of the last model load, not historical
