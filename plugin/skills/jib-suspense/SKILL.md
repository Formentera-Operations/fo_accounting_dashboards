---
name: jib-suspense
description: >
  Generates a JIB Suspense report showing Joint Interest Billing charges held
  in suspense pending resolution. Displays charges awaiting division orders,
  ownership dispute resolution, or other clearing items. Queries gold_fct_jib_suspense
  from Snowflake and exports to Excel with well grouping and suspense reason
  analysis.
version: 0.1.0
---

# JIB Suspense (ODA Report JIBSR)

JIB charges held in suspense pending resolution. Tracks charges awaiting division orders, ownership disputes, or other clearing items that prevent posting to the general ledger.

## Data Source
- **Model**: gold_fct_jib_suspense (GOLD_FINANCIAL schema)
- **Status**: ⚠️ Gold model build in progress
- **System**: Snowflake FO_PRODUCTION_DB via MCP

## Parameters
- `as_of_date` (optional): Report date for suspense aging (YYYY-MM-DD); defaults to today
- `company_code` (optional): Filter by company code (default: '200')
- `well_code` (optional): Filter by specific well code
- `partner_code` (optional): Filter by specific partner code

## Output Columns
- Company
- Well Code
- Well Name
- Partner Code
- Partner Name
- Suspense Amount
- Suspense Reason
- Production Period
- Days in Suspense

## Excel Export
- **File name**: `JIB Suspense - {as_of_date}.xlsx`
- **Tab**: "JIB Suspense"
- **Grouping**: By well
- **Subtotals**: By suspense reason within each well; total suspense amount per reason
- **Total**: Grand total suspense amount with dark blue background
- **Freeze**: Row 5
- **Currency**: USD formatted with 2 decimals
- **Number format**: Amounts in thousands (K)
- **Aging**: Days in suspense highlighted red if > 90 days

## Note
The gold_fct_jib_suspense model is currently under development. This skill will be fully functional once the model is promoted to production.
