---
name: gl-detail-extract
description: >
  Bulk GL journal entry data extract with broader scope than Report 210 (gl-detail).
  Formatted for bulk export and integration, querying int_oda_gl intermediate model with
  expected fallback to gold_fct_gl_details. Supports account range filtering.
version: 0.1.0
---

## GL Detail Extract (ODA Report GLE)

Comprehensive GL journal entry extract for bulk data export, analysis, and system integration.
Broader scope than gl-detail, includes company and period in output, with optional account range filtering.
Formatted as flat export (no grouping) for downstream processing.

### Query Pattern

```sql
SELECT
  c.company_code,
  DATE_TRUNC('month', g.journal_date) AS period,
  g.account_number,
  g.sub_account,
  g.account_name,
  g.voucher_code,
  g.journal_date,
  g.entity_type,
  g.entity_code,
  g.entity_name,
  g.gl_description,
  CASE WHEN g.amount < 0 THEN ABS(g.amount) ELSE 0 END AS debit,
  CASE WHEN g.amount > 0 THEN g.amount ELSE 0 END AS credit,
  g.amount AS net_amount
FROM STAGING.int_oda_gl g
INNER JOIN STAGING.stg_oda__company_v2 c
  ON g.company_code = c.company_code
WHERE DATE(g.journal_date) BETWEEN ? AND ?
  AND g.company_code = ?
  {AND g.account_number BETWEEN ? AND ? IF account_range provided}
ORDER BY g.company_code, g.journal_date, g.voucher_code, g.account_number
```

### Inputs
- **period_start** (required): Start date (YYYY-MM-DD)
- **period_end** (required): End date (YYYY-MM-DD)
- **company_code** (optional): Default = '200'
- **account_range** (optional): Comma-separated pair (start_acct,end_acct); if provided, filters to accounts within range

### Outputs
- Company, Period
- Account, Sub Account, Account Name
- Voucher #, Journal Date, Entity Type, Entity Code, Entity Name
- Description, Debit, Credit

### Excel Format
- Tab: "GL Detail Extract"
- Freeze: Row 1 (headers only)
- Grouping: None (flat export for data warehousing)
- Ordering: Company, Date, Voucher, Account (supports efficient loading to downstream systems)
- Row count: Thousands to tens of thousands typical (design for export, not interactive viewing)

### Model Status
🔶 **Intermediate Model Only**: int_oda_gl (staging)
🔶 **Partial Gold Coverage**: gold_fct_gl_details (exists for cross-clear use only; may not cover all accounts)

⚠️ **Full Gold Model Pending**: gold_fct_gl_details needs expansion to cover all GL accounts or dedicated gold_fct_gl_extract model required

### Data Quality Notes
- Debit/Credit split algorithm: negative amount = debit, positive = credit (standard GL convention)
- Net_amount field preserves sign for reconciliation
- Entity codes and types depend on upstream GL data quality
- Journal date vs accrual date: uses journal_date for extraction; accrual date available in gl-detail skill if needed

### Export Considerations
- Large date ranges (>6 months) may generate 50k+ rows
- Recommend chunking by month for large exports
- CSV or Parquet format recommended for integration
- Include hash or checksum for data validation on receipt
