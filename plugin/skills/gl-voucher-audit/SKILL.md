---
name: gl-voucher-audit
description: >
  Provides an audit trail of GL vouchers with complete posting details including voucher number, date,
  posted-by user, and line-item entries. Queries stg_oda__voucher_v2 staging table with optional
  voucher code filtering. Expected promotion to gold_fct_gl_voucher_audit.
version: 0.1.0
---

## GL Voucher Audit (ODA Report 220)

Comprehensive audit trail of GL voucher posting activity within a date range, showing all line items with user attribution.

### Query Pattern (Current Staging)

```sql
SELECT
  v.voucher_code,
  v.voucher_date,
  v.posted_date,
  v.posted_by_user,
  vl.account_number,
  vl.sub_account,
  vl.entity_code,
  vl.entity_name,
  vl.description,
  CASE WHEN vl.amount < 0 THEN ABS(vl.amount) ELSE 0 END AS debit,
  CASE WHEN vl.amount > 0 THEN vl.amount ELSE 0 END AS credit
FROM STAGING.stg_oda__voucher_v2 v
LEFT JOIN STAGING.stg_oda__voucher_line_v2 vl
  ON v.voucher_id = vl.voucher_id
WHERE v.posted_date BETWEEN ? AND ?
  AND v.company_code = ?
  {AND v.voucher_code = ? IF voucher_code provided}
ORDER BY v.posted_date DESC, v.voucher_code, vl.line_number
```

### Inputs
- **period_start** (required): Start date (YYYY-MM-DD)
- **period_end** (required): End date (YYYY-MM-DD)
- **company_code** (optional): Default = '200'
- **voucher_code** (optional): Single voucher lookup; if provided, overrides date range context

### Outputs
- Voucher #, Voucher Date, Posted Date, Posted By
- Account, Sub Account, Entity, Description
- Debit, Credit

### Excel Format
- Tab: "GL Voucher Audit"
- Freeze: Row 5 (headers + voucher summary)
- Grouping: By voucher number, line detail within
- Subtotals: Per-voucher debit/credit totals
- Grand total: Period debit/credit must balance

### Model Status
🔶 **Staging Only**: stg_oda__voucher_v2 + stg_oda__voucher_line_v2

⚠️ **Gold Model Pending**: gold_fct_gl_voucher_audit (expected structure defined; not yet built)

### Expected Gold Schema
```
voucher_id (PK)
voucher_code (PK)
voucher_date
posted_date
posted_by_user
company_code
line_number (PK)
account_number
sub_account
entity_code
entity_name
description
debit_amount
credit_amount
posting_status
```
