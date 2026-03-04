---
name: ar-transactions
description: >
  Generates "AR Transaction Detail" showing full transaction history for invoices
  including original charges, payments, adjustments, and nettings.
  Used to trigger "show me transactions" or "invoice transaction history".
version: 0.1.0
---

# AR Transaction Detail

Generate full transaction history for invoices from FO_PRODUCTION_DB.GOLD_FINANCIAL.gold_fct_ar_aging_detail.

## Input Parameters

Gather from the user (at least one required):
- `invoice_number`: Specific invoice(s) to report on (can be comma-separated list)
- `owner_code`: Owner code to filter all invoices and their transactions
- `company_code`: Optional, default "200" (Formentera Operations LLC)

## Query Structure

Query `gold_fct_ar_aging_detail` (transaction grain) joined with `gold_fct_ar_aging_summary` for invoice_date:

```sql
SELECT
  d.owner_code,
  d.owner_name,
  d.invoice_number,
  CASE
    WHEN d.transaction_type = 'INV' THEN 'Invoice'
    WHEN d.transaction_type = 'PMT' THEN 'Payment'
    WHEN d.transaction_type = 'ADJ' THEN 'Adjustment'
    WHEN d.transaction_type = 'NET' THEN 'Netting'
    ELSE d.transaction_type
  END AS source,
  d.transaction_date,
  d.transaction_type AS type,
  d.reference_id AS reference,
  d.transaction_amount AS amount,
  d.running_balance AS invoice_balance,
  d.posted_flag AS posted,
  d.voucher_code AS voucher
FROM FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_FCT_AR_AGING_DETAIL d
WHERE d.include_record = 1 AND d.company_code = :company_code
  AND (d.invoice_number IN (:invoice_numbers) OR d.owner_code IN (:owner_codes))
ORDER BY d.owner_name, d.invoice_number, d.sort_order
```

Standard filters: `WHERE include_record = 1 AND company_code = '200'`

## Output Columns

Owner Code, Owner Name, Invoice #, Source (invoice/payment/adjustment/netting), Transaction Date, Type, Reference, Amount (negative=credit), Invoice Balance, Posted, Voucher

## Amount Interpretation

- Positive amounts: Invoice charges (debits to AR)
- Negative amounts: Payments and adjustments (credits to AR)
- Format negative numbers in red for visibility

## Excel Output Format

- Filename: `AR Transaction Detail - {invoice_or_owner} - {as_of_date}.xlsx`
- Tab: "AR Transaction Detail"
- Negative amounts: Red text color
- All amounts: Currency formatted
- Freeze panes: Row 5

## Transaction Types

- `INV`: Original invoice
- `PMT`: Cash payment (reduces balance)
- `ADJ`: Accounting adjustment
- `NET`: Netting transaction (cross-clear entries)

## Edge Cases

- 2028-02-28 sentinel dates may appear in transaction_date — ODA legacy marker; document this
- `sort_order` column controls ODA sequence display (sort by this within invoice)
- Netting transactions appear as two rows per voucher (one debit, one credit) that net to zero
- Posted flag may be null or boolean; format clearly
