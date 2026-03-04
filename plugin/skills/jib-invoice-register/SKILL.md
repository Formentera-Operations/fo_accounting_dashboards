---
name: jib-invoice-register
description: >
  Generates a JIB Invoice Register report showing all JIB invoices generated
  in a billing cycle. Lists invoices by partner with dates, well codes, and
  amounts. Queries gold_fct_jib from Snowflake and exports to Excel with
  partner grouping and formatted totals.
version: 0.1.0
---

# JIB Invoice Register (ODA Report JIBR)

Register of JIB invoices generated in a billing cycle. Tracks all invoices issued to partners with status, amounts, and well associations.

## Data Source
- **Model**: gold_fct_jib (GOLD_FINANCIAL schema)
- **System**: Snowflake FO_PRODUCTION_DB via MCP

## Parameters
- `jib_cycle_start` (required): Start date of JIB billing cycle (YYYY-MM-DD)
- `jib_cycle_end` (required): End date of JIB billing cycle (YYYY-MM-DD)
- `company_code` (optional): Filter by company code (default: '200')
- `partner_code` (optional): Filter by specific partner code

## Output Columns
- Company
- Invoice #
- Partner Code
- Partner Name
- Invoice Date
- Well Code
- Well Name
- Invoice Amount
- Status

## Excel Export
- **File name**: `JIB Invoice Register - {cycle_start} to {cycle_end}.xlsx`
- **Tab**: "JIB Invoice Register"
- **Grouping**: By partner
- **Subtotals**: Invoice count and total amount by partner
- **Total**: Grand total with dark blue background
- **Freeze**: Row 5
- **Currency**: USD formatted with 2 decimals
- **Number format**: Amounts in thousands (K)
- **Sort**: Invoice date ascending within each partner group
