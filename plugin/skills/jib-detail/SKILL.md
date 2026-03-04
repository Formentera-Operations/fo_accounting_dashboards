---
name: jib-detail
description: >
  Generates a JIB Detail report with line-item detail of Joint Interest Billing
  charges by account and well. Shows account-level breakdown of JIB charges with
  partner share calculations. Queries staging model stg_oda__jibdetail from
  Snowflake and exports to Excel with well and account grouping.
version: 0.1.0
---

# JIB Detail (ODA Report JIBD)

Line-item detail of JIB charges by account and well. Provides granular visibility into how charges are allocated across accounts and partners.

## Data Source
- **Model**: stg_oda__jibdetail (STAGING schema) — ⚠️ Gold promotion pending
- **Expected gold model**: gold_fct_jib_detail
- **System**: Snowflake FO_PRODUCTION_DB via MCP

## Parameters
- `period_start` (required): Start date of reporting period (YYYY-MM-DD)
- `period_end` (required): End date of reporting period (YYYY-MM-DD)
- `company_code` (optional): Filter by company code (default: '200')
- `well_code` (optional): Filter by specific well code
- `partner_code` (optional): Filter by specific partner code

## Output Columns
- Company
- Well Code
- Well Name
- Partner Code
- Partner Name
- Account
- Account Name
- Description
- Gross Amount
- Partner Share
- Net Amount

## Excel Export
- **File name**: `JIB Detail - {period_start} to {period_end}.xlsx`
- **Tab**: "JIB Detail"
- **Grouping**: By well, then by account
- **Subtotals**: By partner and account
- **Freeze**: Row 5
- **Currency**: USD formatted with 2 decimals
- **Number format**: Amounts in thousands (K)

## Note
Gold model promotion is currently in progress. This skill uses staging data and will be updated once gold_fct_jib_detail is promoted to production.
