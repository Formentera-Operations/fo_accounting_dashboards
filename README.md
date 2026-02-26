# FO Accounting Dashboards

## Overview

This repository contains the Claude.ai skills and supporting documentation for Formentera Operations' accounting analytics platform.

The goal is to replace the accounting team's current workflow — manually downloading reports from Quorum ODA and running pivot tables and calculations in Excel — with an intelligent, conversational interface powered by Claude.ai.

## What This Enables

Accounting team employees can:
- **Generate standardized reports** by asking Claude to run a specific report for a given period, company, or property (e.g. "Give me the AP Check Register for February 2026")
- **Drill into entity-level records** with ad-hoc questions (e.g. "Why does owner 1042 have revenue in suspense?" or "Show all JIB invoices over $50k that haven't cleared")
- **Export to Excel** in formats that match the reports they already know from Quorum ODA

## How It Works

### Data Layer (`Formentera-Operations/analytics`)
Clean, report-ready gold models in Snowflake built on top of Quorum ODA source data via dbt. One gold model per report type — pre-joined, pre-filtered, no raw CDC data exposed to Claude.

### Interface Layer (this repo)
Claude.ai skills connected to Snowflake via MCP. Two skill types per report:
1. **Structured report skills** — parameterized queries (period, owner, well, company) that return formatted Excel artifacts
2. **Entity drill-down skills** — natural language queries against detail models and dimension tables

## Reports in Scope

| Domain | Reports |
|--------|---------|
| Accounts Payable | AP Check Register, AP Detail Report, AP Report |
| Accounts Receivable | AR Detail Report, AR Report |
| General Ledger | GL Detail/Summary, Multi-Company Trial Balance, GL Voucher Audit, Property Sub-Ledger, AFE Summary, GL Detail Extract, JADE Report |
| JIB | JIB Prelist, JIB Detail, JIB Invoice Register, JIB Suspense |
| Revenue | Revenue Missing Check, Purchaser Receipt History, Revenue Check Prelist, Revenue Check Register, Revenue Suspense, Revenue AR, Owner Revenue Detail, Production Volume |

## Repository Structure

```
docs/
  brainstorms/   ← Design decisions and architecture notes
  plans/         ← Implementation sprint plans
skills/          ← Claude.ai skill definitions
```

## Related

- **Analytics repo:** `Formentera-Operations/analytics` — dbt models and Snowflake gold layer
- **Source system:** Quorum ODA (OnDemand Accounting), ingested via Estuary CDC into Snowflake
