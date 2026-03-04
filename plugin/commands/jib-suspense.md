---
description: JIB Suspense — charges pending resolution
argument-hint: "[as-of-date] [company] [well] [partner]"
---

# jib-suspense

Generate a JIB Suspense report showing Joint Interest Billing charges held in suspense pending resolution.

## Usage
```
/jib-suspense [as-of-date] [company] [well] [partner]
```

## Arguments
- `as-of-date` (optional): Report date for suspense aging (YYYY-MM-DD); defaults to today
- `company` (optional): Company code (default: '200')
- `well` (optional): Specific well code to filter
- `partner` (optional): Specific partner code to filter

## Examples
```
/jib-suspense
/jib-suspense 2025-03-04
/jib-suspense 2025-03-04 200
/jib-suspense 2025-03-04 200 FAT_TIRE_12
/jib-suspense 2025-03-04 200 FAT_TIRE_12 CHEVRON
```

## Output
- Excel file: `JIB Suspense - {as_of_date}.xlsx`
- Grouped by well with subtotals by suspense reason
- Shows amount in suspense, aging in days, and reason for hold

## Note
Gold model (gold_fct_jib_suspense) is under development. Functionality will expand once model is promoted.
