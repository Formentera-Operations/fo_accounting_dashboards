---
date: 2026-02-26
topic: oda-reports-claude-skills
---

# ODA Reports → Claude Skills Architecture

## What We're Building

A two-layer system to replace the accounting team's current workflow of downloading reports from Quorum ODA and running manual pivots/calculations:

1. **Data Layer** — dbt gold models in Snowflake that mirror the exact grain and shape of each Quorum ODA report
2. **Interface Layer** — Claude.ai skills connected to Snowflake via MCP that enable accounting team employees to generate standardized reports and run ad-hoc entity-level analysis

Target users: accounting team. Primary output format: Excel exports.

## Why This Approach

The accounting team needs both structured report runs ("give me the AP Check Register for February") and ad-hoc drill-down ("why does owner 1042 have revenue in suspense?"). Pre-building clean gold models keeps Claude from reasoning about raw CDC staging data, making skills simpler, faster, and more reliable.

## Architecture

### Layer 1: dbt Data Models (Formentera-Operations/analytics)

**Gold Report Models** — pre-aggregated, report-ready, one per ODA report:
- `gold_dim_ap_check_register` — AP check register
- `gold_fct_ap_payment` — AP payment detail
- `gold_fct_ar_aging_detail` — AR invoice detail
- `gold_fct_ar_aging_summary` — AR aging buckets (current / 30 / 60 / 90+)
- `gold_fct_jib` — JIB billing
- `gold_fct_owner_revenue_detail` — owner revenue (in progress)
- `gold_dim_revenue_check_register` — revenue check register
- `gold_fct_production_monthly` — production volumes
- `gold_dim_afe` + `gold_fct_afe_budget` — AFE summary
- *(+ new models to be built — see report mapping below)*

**Entity Dimension Models** — for drill-down by specific record:
- `gold_dim_well`
- `gold_dim_owner`
- `gold_dim_vendor`
- `gold_dim_company`
- `gold_dim_entity`
- `gold_dim_purchaser`

### Layer 2: Claude.ai Skills (this repo)

**MCP Connection:** Snowflake MCP → Formentera Snowflake gold schema

**Two skill types per report:**
1. **Structured report skill** — parameterized query (period, owner, well, company) → formatted Excel artifact
2. **Entity drill-down skill** — ad-hoc NL query against detail model + dimensions

**Excel export:** Claude generates Python artifact using `openpyxl`/`xlsxwriter` formatted to match the Quorum ODA report layout the team already knows.

## ODA Report → dbt Model Mapping

### Accounts Payable

| Report | Gold Model | Status |
|--------|-----------|--------|
| 330 AP Check Register | `gold_dim_ap_check_register` + `gold_fct_ap_payment` | ✅ Exists |
| 340 AP Detail Report | `stg_oda__apinvoicedetail` + `stg_oda__apinvoice` | 🔶 Staging only — needs gold |
| 350 AP Report | `stg_oda__apinvoice` | 🔶 Staging only — needs gold |

### Accounts Receivable

| Report | Gold Model | Status |
|--------|-----------|--------|
| 640 AR Detail Report | `gold_fct_ar_aging_detail` | ✅ Exists |
| ARR AR Report | `gold_fct_ar_aging_summary` + `gold_dim_ar_summary` | ✅ Exists |

### General Ledger

| Report | Gold Model | Status |
|--------|-----------|--------|
| 210 GL Detail/Summary | `int_oda_gl` | 🔶 Intermediate only — needs gold |
| 212 Multi-Company Trial Balance | `stg_oda__gl` + `stg_oda__company_v2` | 🔶 Staging only — needs gold |
| 220 GL Voucher Audit | `stg_oda__voucher_v2` | 🔶 Staging only — needs gold |
| 240 Property Sub-Ledger | — | ❌ Needs to be built |
| AFE Summary | `gold_dim_afe` + `gold_fct_afe_budget` | ✅ Exists |
| GLE GL Detail Extract | `int_oda_gl` | 🔶 Intermediate only — needs gold |
| JAD JADE Report | — | ❌ Needs to be built |

### JIB

| Report | Gold Model | Status |
|--------|-----------|--------|
| 720 JIB Prelist | `gold_fct_jib` | ✅ Exists |
| JIBD JIB Detail | `stg_oda__jibdetail` | 🔶 Staging only — needs gold |
| JIBR JIB Invoice Register | `gold_fct_jib` | ✅ Partial — may need dedicated model |
| JIBSR JIB Suspense | — | ❌ Needs to be built |

### Revenue

| Report | Gold Model | Status |
|--------|-----------|--------|
| 410 Revenue Missing Check | — | ❌ Needs to be built |
| 415 Purchaser Receipt History | `stg_oda__checkrevenue` + `stg_oda__purchaser_v2` | 🔶 Staging only — needs gold |
| 420 Revenue Check Prelist | `gold_dim_revenue_check_register` | ✅ Partial |
| 430 Revenue Check Register | `gold_dim_revenue_check_register` | ✅ Exists |
| 440 Revenue Suspense | `stg_oda__revenue_suspense_category` + `stg_oda__revenue_pending_redistribution` | 🔶 Staging only — needs gold |
| 490 Revenue AR | — | ❌ Needs to be built |
| ORD Owner Revenue Detail | `gold_fct_owner_revenue_detail` | ✅ In progress |
| PVR Production Volume | `gold_fct_production_monthly` | ✅ Exists |

### Summary

| Status | Count |
|--------|-------|
| ✅ Gold model exists | 9 |
| 🔶 Staging/intermediate only — needs gold | 8 |
| ❌ Needs to be built from scratch | 5 |
| **Total** | **22** |

## Key Decisions

- **Gold models over raw staging** — Claude skills query clean, pre-joined tables, not raw CDC data
- **MCP connection type** — Snowflake MCP (direct SQL access) over Cortex Analyst for flexibility
- **Excel via Python artifacts** — `openpyxl`/`xlsxwriter` generated in Claude, formatted to match ODA layouts
- **Two skill types** — structured (parameterized) + ad-hoc (NL entity drill-down)

## Open Questions

- Sequencing: domain-by-domain (Revenue first) vs. quick wins (promote 8 staging-only models first)?
- JIBR vs `gold_fct_jib` — does the existing JIB model cover the Invoice Register format or does it need a dedicated model?
- JAD (JADE Report) — joint audit data exchange format; needs scoping against source tables
- 240 Property Sub-Ledger — needs source table investigation

## Next Steps

→ Align on sequencing (Revenue-first vs. quick-wins-first)
→ `/workflows:plan` for first implementation sprint
→ Scope Snowflake MCP setup and Claude.ai Project configuration
