---
description: JIB Invoice Register — invoices generated in cycle
argument-hint: "[cycle-start] [cycle-end] [company] [partner]"
---

# jib-invoice-register

Generate a JIB Invoice Register report showing all JIB invoices generated in a billing cycle.

## Usage
```
/jib-invoice-register [cycle-start] [cycle-end] [company] [partner]
```

## Arguments
- `cycle-start` (required): Start date of JIB billing cycle (YYYY-MM-DD)
- `cycle-end` (required): End date of JIB billing cycle (YYYY-MM-DD)
- `company` (optional): Company code (default: '200')
- `partner` (optional): Specific partner code to filter

## Examples
```
/jib-invoice-register 2025-01-01 2025-03-31
/jib-invoice-register 2025-01-01 2025-03-31 200
/jib-invoice-register 2025-01-01 2025-03-31 200 MARATHON
```

## Output
- Excel file: `JIB Invoice Register - {cycle_start} to {cycle_end}.xlsx`
- Grouped by partner with invoice count and amount subtotals
- Shows all invoices issued with dates, wells, and amounts
