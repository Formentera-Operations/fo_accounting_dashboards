---
description: Generate AP Check Register report (ODA 330)
argument-hint: [period] [company]
---

## Instructions for Claude

Execute the `ap-check-register` skill to generate an AP Check Register (ODA Report 330) showing all checks and payments issued to vendors.

### Expected Arguments

The user will provide arguments in the format:
- **period**: Date range or period designation (e.g., "Feb 2026", "2026-02-01 to 2026-02-28", "2026-02")
- **company**: Company code or name (optional, defaults to 200 for Formentera Operations LLC)

### Execution Steps

1. Parse the period argument and convert to ISO format date range:
   - "Feb 2026" → 2026-02-01 to 2026-02-28
   - "2026-02" → 2026-02-01 to 2026-02-28
   - "2026-02-01 to 2026-02-28" → use as-is

2. Resolve company argument:
   - If company code (numeric): use as-is
   - If company name contains "Formentera": use code 200
   - If blank/omitted: use default 200

3. Query `FO_PRODUCTION_DB.GOLD_FINANCIAL.gold_dim_ap_check_register` with parameters:
   - `period_start`: First day of period
   - `period_end`: Last day of period
   - `company_code`: Resolved company code (default 200)
   - `vendor_code`: NULL (include all vendors unless user specifies)
   - `include_voided`: NO (exclude voided checks by default)

4. Execute the query and fetch results

5. Format output as Excel workbook:
   - File: `AP Check Register - {period}.xlsx`
   - Sheet: "AP Check Register"
   - Apply formatting per SKILL.md (vendor subtotals in light blue, grand total in dark blue/bold, freeze row 5, currency format)

6. Return the file to the user with summary: count of checks, total amount, period, and any flags (e.g., unreconciled checks, void count)

### Special Cases

- **No checks in period**: Still generate report with headers and $0.00 total
- **User requests voided checks**: Set `include_voided=YES` in query
- **User specifies vendor**: Filter with `vendor_code` parameter
- **Reconciliation flags**: Highlight any checks marked unreconciled in the output summary
