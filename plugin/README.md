# fo-accounting

Formentera Operations accounting report suite. Replaces manual Quorum ODA report downloads with Claude-powered Snowflake queries, Excel exports, and ad-hoc analysis across AR, AP, GL, JIB, and Revenue domains.

## Quick Start

After installing the plugin, use any slash command or ask a natural language question:

```
/ar-aging January 2026
/ap-check-register February 2026
/jib-prelist 12/18/2025 to 01/17/2026
"What is the AR aging for owner 1042?"
"Show me all invoices over 90 days past due over $50,000"
```

## Reports

### Accounts Receivable

| Command | ODA Report | Description | Status |
|---------|-----------|-------------|--------|
| `/ar-aging` | ARR | AR Aging Summary by owner | ✅ Ready |
| `/ar-detail` | 640 | AR Invoice Detail by owner | ✅ Ready |
| `/ar-transactions` | 640 | AR Transaction history by invoice | ✅ Ready |
| `/ar-cross-clear` | — | AR Cross-Clear (revenue vs JIB) | ✅ Ready |
| `/check-register` | 430 | Revenue Check Register | ✅ Ready |
| `/revenue-suspense` | 440 | Revenue Suspense by owner | ✅ Ready |

### Accounts Payable

| Command | ODA Report | Description | Status |
|---------|-----------|-------------|--------|
| `/ap-check-register` | 330 | AP Check Register | ✅ Ready |
| `/ap-detail` | 340 | AP Invoice Detail | 🔶 Gold model pending |
| `/ap-summary` | 350 | AP Summary by vendor | 🔶 Gold model pending |

### General Ledger

| Command | ODA Report | Description | Status |
|---------|-----------|-------------|--------|
| `/gl-detail` | 210 | GL Detail by account | 🔶 Partial (via gold_fct_gl_details) |
| `/gl-trial-balance` | 212 | Multi-Company Trial Balance | 🔶 Gold model pending |
| `/gl-voucher-audit` | 220 | GL Voucher Audit | 🔶 Gold model pending |
| `/property-sub-ledger` | 240 | Property Sub-Ledger | ❌ Gold model not built |
| `/afe-summary` | AFE | AFE Budget vs Actual | ✅ Ready |
| `/gl-detail-extract` | GLE | GL Detail Extract (bulk) | 🔶 Partial |
| `/jade-report` | JAD | JADE Audit Data Exchange | ❌ Gold model not built |

### JIB (Joint Interest Billing)

| Command | ODA Report | Description | Status |
|---------|-----------|-------------|--------|
| `/jib-prelist` | 720 | JIB Prelist | ✅ Ready |
| `/jib-detail` | JIBD | JIB Detail | 🔶 Gold model pending |
| `/jib-invoice-register` | JIBR | JIB Invoice Register | ✅ Ready |
| `/jib-suspense` | JIBSR | JIB Suspense | ❌ Gold model not built |

### Revenue

| Command | ODA Report | Description | Status |
|---------|-----------|-------------|--------|
| `/revenue-missing-check` | 410 | Revenue Missing Check | ❌ Gold model not built |
| `/purchaser-receipt-history` | 415 | Purchaser Receipt History | 🔶 Gold model pending |
| `/revenue-check-prelist` | 420 | Revenue Check Prelist | 🔶 Partial |
| `/owner-revenue-detail` | ORD | Owner Revenue Detail | ✅ Ready |
| `/production-volume` | PVR | Production Volume | ✅ Ready |
| `/revenue-ar` | 490 | Revenue AR | ❌ Gold model not built |

### Status Legend

- ✅ **Ready** — Gold model exists, skill fully operational
- 🔶 **Pending** — Staging/intermediate model exists, needs gold promotion in analytics repo
- ❌ **Not built** — Gold model needs to be built from scratch

## Setup

### Snowflake Connection

The plugin connects to Snowflake with these pre-configured settings:

| Setting | Value |
|---------|-------|
| Account | `formentera-datahub` |
| Database | `FO_PRODUCTION_DB` |
| Warehouse | `DBT_WH` |
| Role | `DBT_ROLE` |
| User | `MICHAEL.SHIRAZ@FORMENTERAOPS.COM` |
| Auth | `externalbrowser` (SSO — browser popup on first query) |

No environment variables are needed. On first use, a browser window will open for SSO authentication.

### Defaults

All reports default to **Company 200 (Formentera Operations LLC)** unless overridden. Claude will state this default before running any query.

## Skills

The plugin includes 22 report-specific skills plus a core accounting-assistant skill that provides:

- Default filter behavior across all reports
- Aging bucket recalculation rules (never use pre-computed columns)
- Period interpretation logic
- Entity name-to-code lookup via ILIKE
- Standardized Excel export formatting
- Gold model catalog reference

## Data Architecture

**Source:** Quorum ODA → Estuary CDC → ESTUARY_DB → dbt → FO_PRODUCTION_DB (gold layer)

**Analytics repo:** `Formentera-Operations/analytics` — dbt models, staging SQL, gold model source

All skills query the gold layer only. Raw staging tables are never accessed directly.
