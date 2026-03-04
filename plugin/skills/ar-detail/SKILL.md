---
name: ar-detail
description: >
  Generates "AR Invoice Detail" showing every open invoice per owner with aging bucket
  and outstanding balance. Used to trigger "show me invoices for" or "AR detail by owner".
version: 0.1.0
---

# AR Invoice Detail

Generate invoice-level AR detail for specific owners from FO_PRODUCTION_DB.GOLD_FINANCIAL.gold_fct_ar_aging_summary.

## Input Parameters

Gather from the user:
- `owner_codes` or `owner_name`: Specific owner(s) to report on (ILIKE search supported)
- `as_of_date`: As-of date for aging calculation (YYYY-MM-DD, default: today or last month-end)
- `company_code`: Optional, default "200" (Formentera Operations LLC)

## Query Structure

Query `gold_fct_ar_aging_summary` at invoice grain (do not group):
- Standard filters: `WHERE include_record = 1 AND company_code = :company_code AND invoice_date <= :as_of_date AND remaining_balance <> 0`
- Add owner filters: `AND owner_code IN (:owner_codes) OR owner_name ILIKE :owner_name_pattern`
- Order by: `owner_name, invoice_date, invoice_number`

## Aging Bucket Calculation

For each invoice row, apply inline DATEDIFF logic (same as ar-aging but per-invoice):

```sql
CASE
  WHEN DATEDIFF('day', invoice_date, :as_of_date) > 90 THEN 'Over 90'
  WHEN DATEDIFF('day', invoice_date, :as_of_date) BETWEEN 61 AND 90 THEN '61-90'
  WHEN DATEDIFF('day', invoice_date, :as_of_date) BETWEEN 31 AND 60 THEN '31-60'
  WHEN DATEDIFF('day', invoice_date, :as_of_date) BETWEEN 0 AND 30 THEN 'Current-30'
  ELSE 'Future'
END AS aging_bucket
```

## Output Columns

Owner Code, Owner Name, Invoice #, Invoice Date, Days Outstanding, Hold Billing, Aging Bucket, Invoice Amount, Outstanding Balance, Posted

## Excel Output Format

- Filename: `AR Invoice Detail - {owner_name} - As Of {as_of_date}.xlsx` (or multi-owner if multiple)
- Tab: "AR Invoice Detail"
- Owner subtotals: Light blue background
- Grand total row: Dark blue background with white text
- Freeze panes: Row 5
- Currency formatted: All amount columns

## Edge Cases

- 2028-02-28 sentinel dates may appear in transaction_date — these are ODA legacy markers; document in notes
- include_record=0 marks missing invoice totals; exclude these rows
- Empty result (no outstanding AR) is valid; show user message instead of blank sheet
