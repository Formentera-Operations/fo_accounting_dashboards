---
name: afe-summary
description: >
  Generates AFE (Authorization for Expenditure) summary showing budget versus actual spend and variance.
  Queries gold_dim_afe and gold_fct_afe_budget from GOLD_FINANCIAL with filtering by company, AFE number, and status.
  Supports status filtering (open, closed, all) and highlights over-budget items.
version: 0.1.0
---

## AFE Summary

Budget versus actual cost tracking for Authorizations for Expenditure (AFEs). Shows completion status, budget variance, and variance percentage.
Highlights over-budget AFEs for cost control visibility.

### Query Pattern

```sql
SELECT
  a.afe_number,
  a.afe_description,
  a.well_code,
  a.well_name,
  a.afe_status,
  b.budget_amount,
  COALESCE(b.actual_amount, 0) AS actual_amount,
  (b.budget_amount - COALESCE(b.actual_amount, 0)) AS variance,
  ROUND(100.0 * COALESCE(b.actual_amount, 0) / NULLIF(b.budget_amount, 0), 1) AS pct_complete,
  CASE
    WHEN COALESCE(b.actual_amount, 0) > b.budget_amount THEN 'OVER'
    WHEN COALESCE(b.actual_amount, 0) >= (b.budget_amount * 0.9) THEN 'CAUTION'
    ELSE 'OK'
  END AS status_flag
FROM GOLD_FINANCIAL.gold_dim_afe a
LEFT JOIN GOLD_FINANCIAL.gold_fct_afe_budget b
  ON a.afe_id = b.afe_id
WHERE a.company_code = ?
  {AND a.afe_number = ? IF afe_number provided}
  {AND a.afe_status = ? IF status provided AND status != 'all'}
ORDER BY a.afe_status, a.afe_number
```

### Inputs
- **company_code** (optional): Default = '200'
- **afe_number** (optional): Single AFE lookup
- **status** (optional): Filter by 'open', 'closed', or 'all'; default = 'all'

### Outputs
- AFE #, AFE Description, Well, Status
- Budget Amount, Actual Amount, Variance, % Complete
- Status Flag (OK / CAUTION / OVER)

### Excel Format
- Tab: "AFE Summary"
- Freeze: Row 5 (headers + summary row)
- Grouping: By status (open, closed)
- Conditional Formatting:
  - Over Budget (variance < 0): Red background
  - Caution (80-100% spent): Yellow background
  - OK: Green background
- Totals: Budget, Actual, Variance totals by status and grand total

### Model Status
✅ **Gold Models Exist**:
- gold_dim_afe (schema: GOLD_FINANCIAL)
- gold_fct_afe_budget (schema: GOLD_FINANCIAL)

### Gold Schema Reference
**gold_dim_afe**
```
afe_id (PK)
afe_number (unique)
afe_description
well_id (FK to gold_dim_wells)
well_code
well_name
afe_status (open | closed | superseded)
company_code
created_date
approved_date
effective_date
```

**gold_fct_afe_budget**
```
afe_id (FK to gold_dim_afe)
period
budget_amount
actual_amount
committed_amount
variance_amount
updated_date
```

### Implementation Notes
- Status values: "open" = active, "closed" = completed/superseded
- Variance is calculated as (Budget - Actual); negative = over budget
- % Complete formula: (Actual / Budget) * 100; capped at 100% for display
- Status flag thresholds: 90%+ of budget = CAUTION; >100% = OVER
