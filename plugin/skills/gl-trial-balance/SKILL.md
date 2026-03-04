---
name: gl-trial-balance
description: >
  Generates a multi-company trial balance report showing account balances across companies for a period.
  Queries stg_oda__gl and stg_oda__company_v2 staging tables, with expected promotion to gold_rpt_trial_balance.
  Returns beginning balance, debits, credits, and ending balance for each account-company combination.
version: 0.1.0
---

## GL Trial Balance (ODA Report 212)

Multi-company trial balance report with account balances for a specified period. Ensures debits equal credits per company.

### Query Pattern (Current Staging)

```sql
SELECT
  g.account_number,
  g.account_name,
  c.company_code,
  c.company_name,
  g.beginning_balance,
  g.total_debits,
  g.total_credits,
  g.ending_balance,
  (g.ending_balance - g.beginning_balance) AS net_change
FROM STAGING.stg_oda__gl g
INNER JOIN STAGING.stg_oda__company_v2 c
  ON g.company_code = c.company_code
WHERE g.period = ?
  {AND g.company_code IN (?) IF company_codes provided}
  {ELSE AND g.company_code = ? IF default}
ORDER BY c.company_code, g.account_number
```

### Inputs
- **period** (required): Period identifier (YYYY-MM or YYYY-MM-DD)
- **company_codes** (optional): Comma-separated list; default = all active companies

### Outputs
- Account #, Account Name
- Company Code, Company Name
- Beginning Balance, Debits, Credits, Ending Balance, Net Change

### Excel Format
- Tab: "Trial Balance"
- Freeze: Row 5 (headers + period summary)
- Grouping: By company, then account order
- Totals: Company subtotals (debits must equal credits); grand total row

### Validation
- Debits MUST equal Credits for each company (tolerance: ±$0.01)
- Alerts if out of balance

### Model Status
🔶 **Staging Only**: stg_oda__gl + stg_oda__company_v2

⚠️ **Gold Model Pending**: gold_rpt_trial_balance (expected structure defined; not yet built)

### Expected Gold Schema
```
account_number (PK)
account_name
company_code (PK)
company_name
period
beginning_balance
total_debits
total_credits
ending_balance
net_change
is_balanced (boolean)
```
