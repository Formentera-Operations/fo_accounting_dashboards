---
description: Generate AP Vendor Summary report (ODA 350)
argument-hint: [date] [company]
---

## Instructions for Claude

Execute the `ap-summary` skill to generate an AP Summary Report (ODA Report 350) showing vendor-level accounts payable with aging analysis.

### Expected Arguments

The user will provide arguments in the format:
- **date**: Report date or "as of" date (e.g., "2026-02-28", "Feb 28 2026", "end of February")
- **company**: Company code or name (optional, defaults to 200 for Formentera Operations LLC)

### Execution Steps

1. Parse the date argument and convert to ISO format (YYYY-MM-DD):
   - "2026-02-28" → use as-is
   - "Feb 28 2026" → 2026-02-28
   - "end of February" → 2026-02-28 (last day of current/implied month)
   - "today" or "current date" → 2026-03-04

2. Resolve company argument:
   - If company code (numeric): use as-is
   - If company name contains "Formentera": use code 200
   - If blank/omitted: use default 200

3. Query `FO_PRODUCTION_DB.GOLD_FINANCIAL`:
   - **Primary model**: `gold_fct_ap_summary` (if available)
   - **Fallback (interim)**: `stg_oda__apinvoice` aggregated to vendor level (if gold model not yet promoted)
   - Parameters:
     - `as_of_date`: Report date (YYYY-MM-DD format)
     - `company_code`: Resolved company code (default 200)
   - Group by: company_code, company_name, vendor_code, vendor_name
   - Aggregate: COUNT(invoices), SUM(invoice_amount), SUM(paid_amount), calculate balance and aging

4. Execute the query and fetch results

5. Calculate aging buckets based on `due_date` to `as_of_date`:
   - **Current (0-30 days)**: days_outstanding <= 30
   - **30-60 days**: 31 <= days_outstanding <= 60
   - **60-90 days**: 61 <= days_outstanding <= 90
   - **90+ days**: days_outstanding > 90

6. Sort results by outstanding_balance (descending) to highlight highest payables first

7. Format output as Excel workbook:
   - File: `AP Summary - {as_of_date}.xlsx`
   - Sheet: "AP Summary"
   - Apply formatting per SKILL.md (vendor subtotals in light blue, grand total in dark blue/bold, freeze row 5, currency format)
   - Apply conditional formatting to aging buckets: Current=Green, 30-60=Yellow, 60-90=Orange, 90+=Red
   - Bold/highlight 90+ day balances > $50K in red

8. Return the file to the user with summary: total vendors, total outstanding balance, breakdown by aging bucket, and highlight any large 90+ day payables

### Special Cases

- **No vendors in period**: Still generate report with headers and $0.00 total
- **Gold model not available**: Use staging tables with note that gold model is pending
- **Negative outstanding balance (overpayment)**: Include in report but flag for investigation
- **Large 90+ day balance**: Escalate in summary (potential disputes or holds)

### Status Note

⚠️ If using staging tables, include note in output: "Report generated from staging tables. Gold model pending promotion (ETA Q2 2026)."

### Cash Planning

Suggest using aging buckets for 13-week cash flow forecast:
- Current + 30-60 days ≈ Cash needed in next 30 days
- 60-90 days + 90+ days ≈ Extended payment obligations
