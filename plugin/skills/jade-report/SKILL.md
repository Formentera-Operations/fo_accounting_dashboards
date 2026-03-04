---
name: jade-report
description: >
  JADE (Joint Audit Data Exchange) standardized data extract for joint interest audit support.
  Formats GL and AFE data to JADE specification for partner audits. Gold model (gold_rpt_jade)
  requires build from scratch; scope pending against source tables.
version: 0.1.0
---

## JADE Report (ODA Report JAD)

Standardized data extract for Joint Audit Data Exchange (JADE) reporting, supporting partner audit requirements.
Combines GL transactions and AFE spend data in JADE-compliant format with operator, partner, and property attribution.

### Inputs
- **period_start** (required): Start date (YYYY-MM-DD)
- **period_end** (required): End date (YYYY-MM-DD)
- **company_code** (optional): Default = '200'
- **well_code** (optional): Filter to specific well
- **afe_number** (optional): Filter to specific AFE (if provided, well_code is derived from AFE)

### Expected Outputs (JADE Standard Format)
- Property Code, Property Name
- Well Code, Well Name
- Account Number, Account Description
- Period, Journal Date
- Debit Amount, Credit Amount, Net Amount
- Operator Code, Operator Name
- Partner Code, Partner Name
- Voucher #, AFE #, Description

### Excel Format
- Tab: "JADE Report"
- Freeze: Row 5 (headers + summary row)
- Grouping: By property, then account, then partner
- Format: JADE-compliant field order and naming
- Totals: By property-operator-partner combination

### Expected Query Pattern (Gold Model TBD)

```sql
SELECT
  j.property_code,
  j.property_name,
  j.well_code,
  j.well_name,
  j.account_number,
  j.account_description,
  DATE_TRUNC('month', j.journal_date) AS period,
  j.journal_date,
  CASE WHEN j.amount < 0 THEN ABS(j.amount) ELSE 0 END AS debit,
  CASE WHEN j.amount > 0 THEN j.amount ELSE 0 END AS credit,
  j.amount AS net_amount,
  j.operator_code,
  j.operator_name,
  j.partner_code,
  j.partner_name,
  j.voucher_code,
  j.afe_number,
  j.description
FROM GOLD_FINANCIAL.gold_rpt_jade j
WHERE DATE(j.journal_date) BETWEEN ? AND ?
  AND j.company_code = ?
  {AND j.well_code = ? IF well_code provided}
  {AND j.afe_number = ? IF afe_number provided}
ORDER BY j.property_code, j.partner_code, j.journal_date, j.account_number
```

### Model Status
❌ **Gold Model Not Yet Built**: gold_rpt_jade

⚠️ **Build Required**: Scope against source tables and JADE specifications

### Expected Gold Schema
```
report_id (PK)
property_code
property_name
well_code
well_name
account_number
account_description
period
journal_date
debit_amount
credit_amount
net_amount
voucher_code
afe_number
description
operator_code
operator_name
partner_code
partner_name
partner_percent_interest
company_code
created_date
```

### Build Considerations
- **Data Sources**: GL transactions, AFE budget, wells, operators, partner interest tables
- **Partner Interest**: Must join partner working interest dimension for accurate % allocation
- **Operator Attribution**: Distinguish operator (Formentera) from partners in output
- **JADE Compliance**: Follow standard JADE 2024 format specifications for field names, ordering, and data types
- **Multi-Property**: Handle AFEs and GL transactions spanning multiple wells or properties
- **Audit Trail**: Maintain source GL voucher references for audit back-reference

### Regulatory Notes
- JADE format required for joint interest audit exchanges
- Partner auditors expect standard column ordering and definitions
- Amounts must align with AFE budget and GL posting records
- Effective dating and status must clearly distinguish active vs superseded AFEs
- Operator vs partner breakout critical for audit compliance

### Dependencies
- Partner interest dimension (gold_dim_partners)
- Operator dimension (gold_dim_operators)
- Well-to-property mapping (gold_dim_wells)
- GL detail with property attribution
- AFE budget with partner allocations
