# Skill: /ar-detail — AR Invoice Detail by Owner

## Purpose
Returns invoice-level AR detail for one or more owners — every open invoice with its
aging bucket assignment and outstanding balance. Used for owner-level collections review
and to reconcile totals from the AR Summary.

## ODA Equivalent
Report 640 — AR Detail by Invoice (owner filter applied)

## Gold Models Used
- `FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_FCT_AR_AGING_SUMMARY` — invoice grain with balances

## Input Parameters

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `owner_codes` | Yes* | One or more owner codes | `83113, 2509` |
| `owner_name` | Yes* | Owner name search (ILIKE) if code unknown | `Britanco` |
| `as_of_date` | No | Defaults to `CURRENT_DATE()` | `2026-02-28` |
| `company_code` | No | Default `200` | `200` |

*Provide either `owner_codes` or `owner_name`. If name search returns multiple matches,
list them and ask user to confirm before querying.

## Standard Filters
```sql
WHERE include_record = 1
  AND company_code = '200'
  AND invoice_date <= :as_of_date
  AND remaining_balance <> 0
  AND owner_code IN (:owner_codes)
ORDER BY owner_name, invoice_date, invoice_number
```

## Aging Bucket Logic
Same inline DATEDIFF approach as `/ar-aging`. Apply to each invoice row:
```sql
CASE
    WHEN DATEDIFF('day', invoice_date, :as_of_date) > 90  THEN 'Over 90'
    WHEN DATEDIFF('day', invoice_date, :as_of_date) > 60  THEN '61-90 Days'
    WHEN DATEDIFF('day', invoice_date, :as_of_date) > 30  THEN '31-60 Days'
    ELSE 'Current-30'
END AS aging_bucket
```

## Output Columns

| Column | Source |
|--------|--------|
| Owner Code | `owner_code` |
| Owner Name | `owner_name` |
| Invoice # | `invoice_number` |
| Invoice Date | `invoice_date` |
| Days Outstanding | `DATEDIFF('day', invoice_date, :as_of_date)` |
| Hold Billing | `hold_billing` |
| Aging Bucket | inline CASE |
| Invoice Amount | `total_invoice_amount` |
| Outstanding Balance | `remaining_balance` |
| Posted | `is_invoice_posted` |

## Response Format
Lead with a one-sentence summary:
> "Owner 83113 Britanco LLC has 47 open invoices totaling $4.8M outstanding,
> of which $2.5M is over 90 days past due."

Then show the invoice table. Group by aging bucket if more than 10 invoices.

For follow-up questions on specific invoices, use `/ar-transactions` to drill into
the payment/adjustment history for that invoice number.

## Excel Format
- **Tab name:** `AR Invoice Detail`
- **Subtitle:** "Company {code} | As of {as_of_date} | Outstanding invoices only"
- **Owner subtotal rows:** light blue fill, bold
- **Grand total row:** dark blue fill, white bold text
- **Freeze panes:** Row 5
- **File name:** `AR Invoice Detail - {owner_name} - As Of {as_of_date}.xlsx`

## Edge Cases
- **2028-02-28 sentinel dates:** Some invoices in `gold_fct_ar_aging_detail` show
  `transaction_date = 2028-02-28` — this is an ODA placeholder. Use `invoice_date`
  from the summary model for aging, not transaction dates.
- **include_record = 0:** If the user says totals don't match ODA, check whether
  advance/closeout pairs exist: `WHERE owner_code = :code AND include_record = 0`.
