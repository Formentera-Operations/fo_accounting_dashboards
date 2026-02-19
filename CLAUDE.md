# fo_accounting_dashboards

Web app dashboards for Formentera Operations accounting reports. Data models and frontend formats that surface financial metrics from the dbt/Snowflake analytics stack.

## Project Purpose

This repo constructs web-facing accounting reports — Lease Operating Statements, production revenue summaries, LOE breakdowns, and basin-level P&L — drawing on marts and semantic models built in the `analytics` repo.

## Relationship to Analytics Repo

| Layer | Repo |
|-------|------|
| Source ingestion, staging, intermediate, marts | [`analytics`](https://github.com/Formentera-Operations/analytics) |
| Dashboard data models, API shapes, web app config | **this repo** |

Do not duplicate transformation logic here. If a calculation doesn't exist in `analytics`, add it there first, then reference the mart/semantic model here.

## Data Sources

Dashboards pull from Snowflake marts in `FO_PROD_DB`:

| Domain | Key Marts |
|--------|-----------|
| Revenue | `fct_revenue`, `fct_commodity_revenue` |
| LOE | `fct_loe`, `fct_loe_by_category` |
| Production | `fct_production`, `dim_wells`, `dim_properties` |
| Workover | `fct_workover_expenses` |
| P&L | `fct_well_pnl`, `fct_property_pnl` |

Basins: Permian, Eagle Ford, SCOOP/STACK, Williston.

## Hard Rules

- **Never** hardcode well IDs, property IDs, or basin names — drive from Snowflake lookups
- **Never** perform financial calculations in the frontend — use Snowflake views/marts
- **Always** use parameterized queries — no string interpolation into SQL
- **Always** scope Snowflake queries by date range and basin to avoid full scans
- **Never** commit secrets, connection strings, or API keys — use environment variables

## Snowflake Connection

- **Account:** `YL35090.south-central-us.azure`
- **Auth:** RSA keypair or service account (see environment config)
- **Database:** `FO_PROD_DB` (prod) / `FO_DEV_DB` (dev)
- **Role:** `REPORTING_ROLE`

## CI/CD

PRs trigger Claude Code Review automatically (`.github/workflows/claude-review.yml`).
Mention `@claude` in any PR comment for on-demand review.
