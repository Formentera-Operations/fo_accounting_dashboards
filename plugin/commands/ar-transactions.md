---
description: Show transaction history for invoice(s) or owner
argument-hint: [invoice-number|owner-code]
---

# AR Transaction Detail Command

When the user invokes this command, generate the transaction-level AR detail report.

## What to Do

1. Ask the user for the parameters:
   - Invoice number(s) or owner code (required)
   - Company code (optional, default: 200)

2. Query `FO_PRODUCTION_DB.GOLD_FINANCIAL.gold_fct_ar_aging_detail`:
   - Filter: include_record = 1 AND company_code = 200
   - Invoice filter: invoice_number IN (...) OR owner_code IN (...)
   - Order by: owner_name, invoice_number, sort_order

3. For each transaction row, map the source:
   - Transaction type INV → "Invoice"
   - Transaction type PMT → "Payment"
   - Transaction type ADJ → "Adjustment"
   - Transaction type NET → "Netting"

4. Format amounts with sign handling:
   - Positive amounts: Debits to AR
   - Negative amounts: Credits to AR (display in red)
   - All amounts: Currency format

5. Build the Excel output:
   - Dark blue header, dark blue bold grand total
   - Negative amounts in red text
   - Freeze panes at row 5
   - Filename: AR Transaction Detail - {invoice_or_owner} - {date}.xlsx

6. Return the Excel file to the user.

## Key Rules

- Use sort_order column to maintain ODA sequence within each invoice
- Mark netting transactions clearly (two rows per voucher that net to zero)
- Flag any 2028-02-28 sentinel dates as legacy ODA markers
- Include posted flag in output (helps identify unposted items)
