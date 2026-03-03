# Skill: /ar-cross-clear — AR Cross-Clear

## Purpose
Shows GL journal entries that net Revenue Payable (account 501.x) against AR JIB
(account 130.x) for a given period. Each cross-clear produces two paired rows that
net to zero per voucher — one debit on 501 and one credit on 130. Used to reconcile
the "Netting" column in the AR Summary and to trace which revenue payments were applied
against outstanding JIB balances.

## ODA Equivalent
AR Cross-Clear Report (accessed from AR module, no standard report number)

## Gold Models Used
- `FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_FCT_GL_DETAILS` — GL journal entry grain

## Input Parameters

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `period_start` | Yes | First day of period | `2026-01-01` |
| `period_end` | Yes | Last day of period | `2026-01-31` |
| `owner_code` | No | Filter to specific owner/entity | `83113` |
| `company_code` | No | Default `200` | `200` |

If user says "January cross-clear", set `period_start = 2026-01-01`, `period_end = 2026-01-31`.

## Standard Query Pattern
```sql
SELECT
    main_account,
    sub_account,
    account_name,
    voucher_code,
    entity_type,
    entity_code,
    entity_name,
    CAST(journal_date AS DATE)  AS journal_date,
    CAST(accrual_date AS DATE)  AS accrual_date,
    gl_description,
    net_amount
FROM FO_PRODUCTION_DB.GOLD_FINANCIAL.GOLD_FCT_GL_DETAILS
WHERE main_account IN ('501', '130')
  AND sub_account IN ('1', '2', '3', '4')
  AND (
      gl_description LIKE '%Net Revenue Against A/R%'
      OR gl_description LIKE '%AR Cross Clear%'
  )
  AND journal_date >= :period_start
  AND journal_date <= :period_end
ORDER BY voucher_code, main_account
```

## Output Columns

| Column | Source |
|--------|--------|
| Main Account | `main_account` |
| Sub Account | `sub_account` |
| Account Name | `account_name` |
| Voucher # | `voucher_code` |
| Entity Type | `entity_type` |
| Entity Code | `entity_code` |
| Entity Name | `entity_name` |
| Journal Date | `journal_date` |
| Accrual Date | `accrual_date` |
| Description | `gl_description` |
| Amount | `net_amount` (debits positive, credits negative) |

## Pairing Logic
Each cross-clear voucher produces two rows that net to zero:
- **Debit row:** account 501.x (Revenue Payable) — positive amount
- **Credit row:** account 130.x (A/R JIB) — negative amount

To show only the net effect per owner, group by `entity_code` and `SUM(net_amount)`.
To show paired rows for audit purposes, display all rows ordered by `voucher_code`.

## Response Format
Lead with summary: "In January 2026, 14 cross-clear entries totaling $X were processed,
netting revenue against AR for 8 owners."

Then show the table. If user asks about a specific owner, filter and show paired rows
with voucher groupings so they can trace each transaction.

## Excel Format
- **Tab name:** `AR Cross-Clear`
- **Subtitle:** "Company {code} | Cross-Clear Entries | {period_start} to {period_end}"
- **Debit rows:** normal formatting
- **Credit rows:** red text or parentheses for negative amounts
- **Subtotal per voucher:** light blue fill showing net = 0
- **Freeze panes:** Row 5
- **File name:** `AR Cross-Clear - {period}.xlsx`

## Edge Cases
- **Net amount per owner ≠ 0:** If filtering by entity_code, the entity may have
  multiple vouchers in the period. Sum across all vouchers for the period total.
- **Sub-accounts beyond 1-4:** The filter `sub_account IN ('1','2','3','4')` covers
  the primary AR and Revenue Payable accounts. Expand if user reports missing entries.
- **Accrual date vs journal date:** ODA typically filters on `accrual_date` for period
  reports. `journal_date` is the posting date. Use `journal_date` for consistency with
  the AR Summary netting filter.
