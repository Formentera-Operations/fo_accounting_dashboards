# Skill: /ar-transactions — AR Transaction Detail by Invoice

## Purpose
Returns the full transaction history for one or more invoices — showing the original
invoice charge plus all payments, adjustments, and nettings applied against it.
Used to answer "why is this invoice not fully paid?" and to reconcile a specific
invoice balance.

## ODA Equivalent
Report 640 — AR Detail Report (transaction-level view, expanded per invoice)

## Gold Models Used
- `FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_FCT_AR_AGING_DETAIL` — transaction grain
- `FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_FCT_AR_AGING_SUMMARY` — joined for invoice_date (aging)

## Input Parameters

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `invoice_number` | Yes* | Specific invoice to drill into | `530613` |
| `owner_code` | Yes* | All invoices for an owner | `1592` |
| `company_code` | No | Default `200` | `200` |

*Provide either `invoice_number` or `owner_code`. Both can be combined.

## Standard Filters
```sql
WHERE d.include_record = 1
  AND d.company_code = '200'
  AND d.owner_code = :owner_code          -- or d.invoice_number = :invoice_number
ORDER BY d.owner_name, d.invoice_number, d.sort_order
```

## Output Columns

| Column | Source |
|--------|--------|
| Owner Code | `d.owner_code` |
| Owner Name | `d.owner_name` |
| Invoice # | `d.invoice_number` |
| Source | `d.transaction_source` (invoice/payment/adjustment/netting) |
| Transaction Date | `CAST(d.transaction_date AS DATE)` |
| Type | `d.transaction_type` |
| Reference | `d.transaction_reference` |
| Amount | `d.balance_due` (negative = credit/payment) |
| Invoice Balance | `d.remaining_balance` (parent invoice outstanding) |
| Posted | `d.is_invoice_posted` |
| Voucher | `d.voucher_number` |

## Response Format
Group output by invoice number. For each invoice show:
1. The invoice row (positive amount)
2. All payment/adjustment rows beneath it (negative amounts)
3. Remaining balance as a subtotal

Example narrative:
> "Invoice #530613 was billed at $6,995.71 on 2025-12-31. Two adjustments have been
> applied: a cross-clear of ($250.00) on 2026-01-25 and ($33.56) on 2025-06-24,
> leaving a remaining balance of $6,712.15."

## Excel Format
- **Tab name:** `AR Transaction Detail`
- **Subtitle:** "Company {code} | Invoice/payment history"
- **Negative amounts:** display as red text or parentheses for credits
- **Freeze panes:** Row 5
- **File name:** `AR Transactions - {owner or invoice} - {date}.xlsx`

## Edge Cases
- **2028-02-28 sentinel dates:** `transaction_date` on invoice rows often shows
  `2028-02-28` in ODA — this is a placeholder, not the actual invoice date.
  Use `invoice_date` from `gold_fct_ar_aging_summary` (joined on `invoice_number`)
  for any date-based display or aging.
- **sort_order:** Always ORDER BY `sort_order` within each invoice to maintain
  ODA's native display sequence (invoice first, then transactions chronologically).
- **Netting transactions:** `transaction_source = 'netting'` and `transaction_type = 'Xclear'`
  represent AR cross-clear entries. These reduce the AR balance and appear as negatives.
