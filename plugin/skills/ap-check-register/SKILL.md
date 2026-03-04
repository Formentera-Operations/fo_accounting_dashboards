---
name: ap-check-register
description: >
  Generates ODA Report 330 — AP Check Register. Shows "all AP checks and payments issued to vendors" in a specified period, with vendor, check, and reconciliation details.
version: 0.1.0
---

## Overview
The AP Check Register (ODA Report 330) displays all checks and payments issued to vendors during a specified period. Use this skill to audit vendor payments, track check reconciliation, and identify voided or pending checks.

## Data Source
**Gold Model**: `gold_dim_ap_check_register` + `gold_fct_ap_payment`
**Database**: `FO_PRODUCTION_DB.GOLD_FINANCIAL` (Snowflake)

## Required Input Parameters

- **period_start** (required): First day of reporting period (YYYY-MM-DD)
- **period_end** (required): Last day of reporting period (YYYY-MM-DD)
- **company_code** (optional, default: 200): Formentera Operations LLC company code
- **vendor_code** (optional): Filter results to specific vendor; leave blank for all vendors
- **include_voided** (optional, default: NO): Set to YES to include voided checks in output

## Query Pattern

```sql
SELECT
  company_code,
  company_name,
  check_number,
  check_date,
  check_type,
  check_type_name,
  check_amount,
  main_account,
  sub_account,
  account_name,
  voucher_code,
  entity_code,
  entity_name,
  void_date,
  reconciled,
  voided
FROM gold_dim_ap_check_register
WHERE check_date >= :period_start
  AND check_date <= :period_end
  AND company_code = :company_code
  AND voided = CASE WHEN :include_voided = 'YES' THEN voided ELSE 'NO' END
  AND (:vendor_code IS NULL OR entity_code = :vendor_code)
ORDER BY entity_name, check_date, check_number;
```

## Output Columns

| Column | Source | Description |
|--------|--------|-------------|
| Company Code | company_code | Formentera company identifier |
| Company Name | company_name | Legal entity name |
| Check # | check_number | Unique check identifier |
| Vendor Code | entity_code | GL vendor/entity code |
| Vendor Name | entity_name | Vendor legal name |
| Check Date | check_date | Date check was issued |
| Check Type | check_type_name | Payment method (e.g., ACH, Wire, Paper Check) |
| Check Amount | check_amount | Dollar amount of payment |
| GL Account | main_account, sub_account | Account code (e.g., 5000-1200) |
| Account Name | account_name | GL account description |
| Voucher # | voucher_code | Associated voucher reference |
| Reconciled | reconciled | YES/blank indicating bank reconciliation status |
| Voided | voided | YES if check was voided; NO otherwise |
| Void Date | void_date | Date check was voided (null if not voided) |

## Excel Output Format

**File Name**: `AP Check Register - {period}.xlsx`
**Sheet Name**: "AP Check Register"

Formatting:
- **Subtotals by Vendor**: Light blue background with SUM formulas for check amounts
- **Grand Total Row**: Dark blue background with white bold text, SUM of all checks
- **Freeze Panes**: Freeze at Row 5 (headers + company summary row)
- **Currency**: Format all dollar columns as currency with 2 decimal places
- **Number Format**: Check numbers as text; dates as MM/DD/YYYY

## Edge Cases & Validation

1. **No checks in period**: Output header row and grand total of $0.00
2. **Voided checks**: By default excluded; set `include_voided=YES` to include with "VOIDED" label
3. **Unreconciled checks**: Display blank in "Reconciled" column; flag in summary if count > threshold
4. **Negative amounts**: Display in red; indicate reversals or adjustments in audit trail
5. **Multi-account checks**: If a single check maps to multiple GL accounts, display one row per account with amount split
6. **Null vendor codes**: Flag as "UNKNOWN VENDOR" and investigate before distribution

## Example Usage

```
Period: 2026-02-01 to 2026-02-28
Company: Formentera Operations LLC (200)
Vendor Filter: None
Include Voided: NO
```

Expected output: All non-voided checks issued in February, subtotaled by vendor with grand total.

## Notes

- Reconciled status pulled from bank rec module; confirm against bank statement
- Check amounts must match corresponding AP invoice totals
- Investigate any duplicate check numbers immediately
