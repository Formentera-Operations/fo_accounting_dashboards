---
name: jib-prelist
description: >
  Generates a JIB Prelist report showing a preview of Joint Interest Billing
  charges before posting. Displays billing amounts by partner and well before
  the JIB cycle closes. Queries gold_fct_jib from Snowflake and exports to
  Excel with well grouping, partner subtotals, and formatted totals.
version: 0.1.0
---

# JIB Prelist (ODA Report 720)

Preview of JIB charges before posting to the general ledger. Useful for validating charges, reviewing partner splits, and planning for the billing cycle close.

## Data Source
- **Model**: gold_fct_jib (GOLD_FINANCIAL schema)
- **System**: Snowflake FO_PRODUCTION_DB via MCP

## Parameters
- `jib_cycle_start` (required): Start date of JIB billing cycle (YYYY-MM-DD)
- `jib_cycle_end` (required): End date of JIB billing cycle (YYYY-MM-DD)
- `company_code` (optional): Filter by company code (default: '200')
- `well_code` (optional): Filter by specific well code
- `partner_code` (optional): Filter by specific partner code

## Output Columns
- Company
- Well Code
- Well Name
- Partner Code
- Partner Name
- Interest %
- Gross Amount
- Net Amount
- JIB Type
- Status

## Excel Export
- **File name**: `JIB Prelist - {cycle_start} to {cycle_end}.xlsx`
- **Tab**: "JIB Prelist"
- **Grouping**: By well
- **Subtotals**: By partner within each well
- **Total**: Grand total with dark blue background
- **Freeze**: Row 5
- **Currency**: USD formatted with 2 decimals
- **Number format**: Amounts in thousands (K)
