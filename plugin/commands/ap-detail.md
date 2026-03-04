---
description: Generate AP Invoice Detail report (ODA 340)
argument-hint: [period] [company]
---

## Instructions for Claude

Execute the `ap-detail` skill to generate an AP Invoice Detail Report (ODA Report 340) showing invoice-level accounts payable transactions with payment status.

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

3. Query `FO_PRODUCTION_DB.GOLD_FINANCIAL`:
   - **Primary model**: `gold_fct_ap_detail` (if available)
   - **Fallback (interim)**: `stg_oda__apinvoicedetail` + `stg_oda__apinvoice` (if gold model not yet promoted)
   - Parameters:
     - `period_start`: First day of period (invoice_date >= this)
     - `period_end`: Last day of period (invoice_date <= this)
     - `company_code`: Resolved company code (default 200)
     - `vendor_code`: NULL (include all vendors unless user specifies)

4. Execute the query and fetch results

5. Calculate derived columns if not in source data:
   - `balance`: invoice_amount - paid_amount
   - `payment_status`: PAID (balance = 0) | PARTIAL (0 < balance < invoice_amount) | PENDING (balance = invoice_amount and not overdue) | OVERDUE (balance > 0 and due_date < today)

6. Format output as Excel workbook:
   - File: `AP Invoice Detail - {period}.xlsx`
   - Sheet: "AP Invoice Detail"
   - Apply formatting per SKILL.md (vendor subtotals in light blue, grand total in dark blue/bold, freeze row 5, currency format)
   - Apply conditional formatting: PAID=Green, PARTIAL=Yellow, PENDING=White, OVERDUE=Red

7. Return the file to the user with summary: count of invoices, total invoiced, total paid, outstanding balance, and aging profile

### Special Cases

- **No invoices in period**: Still generate report with headers and $0.00 total
- **Gold model not available**: Use staging tables with note that gold model is pending
- **User specifies vendor**: Filter with `vendor_code` parameter
- **Multi-line invoices**: Display one row per line item; group by invoice # for subtotals
- **Negative balance (overpayment)**: Flag in summary for investigation

### Status Note

⚠️ If using staging tables, include note in output: "Report generated from staging tables. Gold model pending promotion (ETA Q2 2026)."
