---
description: JIB Prelist — preview charges before posting
argument-hint: "[cycle-start] [cycle-end] [company] [well] [partner]"
---

# jib-prelist

Generate a JIB Prelist report showing a preview of Joint Interest Billing charges before posting.

## Usage
```
/jib-prelist [cycle-start] [cycle-end] [company] [well] [partner]
```

## Arguments
- `cycle-start` (required): Start date of JIB billing cycle (YYYY-MM-DD)
- `cycle-end` (required): End date of JIB billing cycle (YYYY-MM-DD)
- `company` (optional): Company code (default: '200')
- `well` (optional): Specific well code to filter
- `partner` (optional): Specific partner code to filter

## Examples
```
/jib-prelist 2025-01-01 2025-03-31
/jib-prelist 2025-01-01 2025-03-31 200
/jib-prelist 2025-01-01 2025-03-31 200 FAT_TIRE_12
/jib-prelist 2025-01-01 2025-03-31 200 FAT_TIRE_12 EXXON
```

## Output
- Excel file: `JIB Prelist - {cycle_start} to {cycle_end}.xlsx`
- Grouped by well with partner subtotals
- Shows billing amounts before posting
