# AR Aging Project

## Overview

Replaces the manual AR aging workflow currently run out of Quorum ODA. Accounting team downloads AR reports and runs pivot calculations — this project automates that into Claude.ai skills backed by Snowflake gold models.

## Reports in Scope

| Report Code | Report Name | Gold Model | Status |
|-------------|-------------|-----------|--------|
| 640 | AR Detail Report | `gold_fct_ar_aging_detail` | ✅ Exists |
| ARR | AR Report | `gold_fct_ar_aging_summary` + `gold_dim_ar_summary` | ✅ Exists |

## Folder Structure

```
projects/ar_aging/
  README.md      ← this file
  skills/        ← Claude.ai skill definitions (.md)
  docs/          ← field mappings, business logic, SQL patterns
```

## Key Entities

- **Invoices** — AR invoices with due dates, amounts, and aging bucket assignment
- **Payments** — payments applied against invoices
- **Companies** — multi-company support via `gold_dim_company`
- **Wells / Properties** — property-level sub-ledger linkage

## Aging Buckets

| Bucket | Definition |
|--------|-----------|
| Current | Not yet due |
| 1–30 days | 1–30 days past due |
| 31–60 days | 31–60 days past due |
| 61–90 days | 61–90 days past due |
| 90+ days | Over 90 days past due |

## Skills Planned

1. **AR Aging Summary** — parameterized by period and company → Excel export matching ODA Report ARR format
2. **AR Detail Drill-down** — entity-level lookup by invoice, company, or well → ODA Report 640 format
3. **AR Cross-Clear** — invoice-to-payment matching analysis (future)

## Related

- Analytics repo models: `models/operations/gold/financial/gold_fct_ar_aging_detail.sql`, `gold_fct_ar_aging_summary.sql`
- Brainstorm: `docs/brainstorms/2026-02-26-oda-reports-claude-skills-brainstorm.md`
