---
name: gl-detail
description: >
  Retrieves journal entry detail for a GL account and period, providing complete GL Detail/Summary reporting.
  Queries "account" by main_account and period range from GOLD_FINANCIAL.gold_fct_gl_details model
  or falls back to int_oda_gl intermediate model. Supports optional "sub_account" filtering.
version: 0.1.0
---

## GL Detail (ODA Report 210)

Fetches journal-level GL activity for a given account and date range, with full breakdown by voucher and entity.

### Query Pattern

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
  CASE WHEN net_amount < 0 THEN ABS(net_amount) ELSE 0 END AS debit,
  CASE WHEN net_amount > 0 THEN net_amount ELSE 0 END AS credit,
  net_amount
FROM GOLD_FINANCIAL.gold_fct_gl_details
WHERE main_account = ?
  AND DATE(journal_date) BETWEEN ? AND ?
  AND company_code = ?
  {AND sub_account = ? IF sub_account provided}
ORDER BY journal_date, voucher_code
```

### Inputs
- **account** (required): Main GL account number
- **period_start** (required): Start date (YYYY-MM-DD)
- **period_end** (required): End date (YYYY-MM-DD)
- **company_code** (optional): Default = '200'
- **sub_account** (optional): Filter by specific sub-account

### Outputs
- Account, Sub Account, Account Name
- Voucher #, Entity, Journal Date, Accrual Date
- Description, Debit, Credit, Net Amount

### Excel Format
- Tab: "GL Detail"
- Freeze: Row 5 (headers + summary row)
- Grouping: Account subtotals
- Totals: Period total row at end

### Model Status
🔶 **Gold Model**: gold_fct_gl_details (exists in GOLD_FINANCIAL for cross-clear use; may need extension for full coverage)
🔶 **Intermediate Fallback**: int_oda_gl (staging only)

⚠️ **Note**: Confirm availability of gold_fct_gl_details for all account types before deployment.
