---
name: property-sub-ledger
description: >
  Generates GL activity by property/well for a specified period, showing all GL transactions
  rolled up at the well and account level. Gold model (gold_fct_property_sub_ledger) requires
  build from scratch; currently no staging model available.
version: 0.1.0
---

## Property Sub-Ledger (ODA Report 240)

GL activity summary by property/well, showing account-level debits, credits, and net amounts per property.
Useful for property-level cost control and reconciliation.

### Inputs
- **period_start** (required): Start date (YYYY-MM-DD)
- **period_end** (required): End date (YYYY-MM-DD)
- **company_code** (optional): Default = '200'
- **well_code** (optional): Filter to specific well; if omitted, shows all wells

### Expected Query Pattern (Gold Model TBD)

```sql
SELECT
  w.well_code,
  w.well_name,
  g.account_number,
  g.account_description,
  SUM(CASE WHEN g.amount < 0 THEN ABS(g.amount) ELSE 0 END) AS debit,
  SUM(CASE WHEN g.amount > 0 THEN g.amount ELSE 0 END) AS credit,
  SUM(g.amount) AS net_amount
FROM GOLD_FINANCIAL.gold_fct_property_sub_ledger g
INNER JOIN GOLD_DIMENSIONAL.gold_dim_wells w
  ON g.well_id = w.well_id
WHERE DATE(g.journal_date) BETWEEN ? AND ?
  AND g.company_code = ?
  {AND w.well_code = ? IF well_code provided}
GROUP BY w.well_code, w.well_name, g.account_number, g.account_description
ORDER BY w.well_code, g.account_number
```

### Outputs
- Well Code, Well Name
- Account, Description
- Debit, Credit, Net Amount

### Excel Format
- Tab: "Property Sub-Ledger"
- Freeze: Row 5 (headers + well summary)
- Grouping: By well, then by account
- Subtotals: Per-well totals; per-account totals within well
- Grand total: Period totals for company

### Model Status
❌ **Gold Model Not Yet Built**: gold_fct_property_sub_ledger

⚠️ **Build Required**: Model must be constructed from source tables, likely joining:
- GL detail transactions (gl journal entries)
- Well dimension (gold_dim_wells)
- Account dimension (gold_dim_accounts)

### Dependencies
- Well dimension populated and linked to GL transactions
- GL transactions include well_id or well_code attribution
- Account hierarchy properly defined in gold_dim_accounts

### Implementation Notes
- Coordinate with data engineering on property/well GL mapping
- Consider P&L vs balance sheet account split in initial load
- Ensure well_code matches AFE and production reporting dimensions
