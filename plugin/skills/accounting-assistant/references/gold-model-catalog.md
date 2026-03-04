# Gold Model Catalog

All gold models live in `FO_PRODUCTION_DB`. Schema names follow the pattern `gold_{domain}`.

## Snowflake Connection

| Setting | Value |
|---------|-------|
| Account | `formentera-datahub` |
| Database | `FO_PRODUCTION_DB` |
| Warehouse | `DBT_WH` |
| Role | `DBT_ROLE` |
| User | `MICHAEL.SHIRAZ@FORMENTERAOPS.COM` |
| Auth | `externalbrowser` (SSO) |

---

## Accounts Receivable — `GOLD_FINANCIAL`

### `GOLD_FCT_AR_AGING_SUMMARY`
**ODA equivalent:** Report ARR (AR Report)
**Grain:** One row per invoice
**Standard filter:** `WHERE include_record = 1`

| Column | Description |
|--------|-------------|
| `invoice_id` | PK |
| `invoice_number` | Invoice identifier |
| `company_code` / `company_name` | Operating company |
| `owner_id` / `owner_code` / `owner_name` | Invoice recipient |
| `well_id` / `well_code` / `well_name` | Associated well/property |
| `invoice_date` | Invoice date (used to calculate aging) |
| `days_past_due` | Days since invoice_date; negative = future-dated |
| `total_invoice_amount` | Gross invoice amount |
| `remaining_balance` | Outstanding balance |
| `current_balance` | Balance not yet due (days_past_due <= 0) |
| `balance_1_30_days` | 1-30 days past due (⚠️ pre-computed — recalculate inline) |
| `balance_31_60_days` | 31-60 days past due (⚠️ pre-computed) |
| `balance_61_90_days` | 61-90 days past due (⚠️ pre-computed) |
| `balance_90_plus_days` | Over 90 days past due (⚠️ pre-computed) |
| `is_invoice_posted` | `true` = posted to GL |
| `include_record` | `1` = include in standard aging report |
| `hold_billing` | Invoice is on billing hold |
| `voucher_number` | GL voucher reference |
| `invoice_description` | Free-text description |

### `GOLD_FCT_AR_AGING_DETAIL`
**ODA equivalent:** Report 640 (AR Detail Report)
**Grain:** One row per AR transaction (invoice, payment, adjustment, netting)

| Column | Description |
|--------|-------------|
| `invoice_id` | Parent invoice FK |
| `transaction_source` | `invoice` / `payment` / `adjustment` / `netting` |
| `transaction_date` | Date of the transaction |
| `transaction_type` | Invoice type label |
| `transaction_reference` | Free-text reference |
| `balance_due` | Transaction amount |
| `remaining_balance` | Parent invoice outstanding balance |
| `include_record` | `1` = include in standard report |
| `company_code` / `company_name` | Operating company |
| `owner_code` / `owner_name` | Invoice recipient |
| `well_code` / `well_name` | Associated well |
| `invoice_number` | Parent invoice number |
| `voucher_number` | GL voucher reference |
| `is_invoice_posted` | Posted status of parent invoice |
| `sort_order` | Display ordering |

---

## General Ledger — `GOLD_FINANCIAL`

### `GOLD_FCT_GL_DETAILS`
**ODA equivalent:** AR Cross-Clear, GL Detail Extract (GLE)
**Grain:** One row per GL journal entry line

| Column | Description |
|--------|-------------|
| `main_account` | GL main account code (e.g. 501, 130) |
| `sub_account` | GL sub account code (e.g. 1, 2, 3, 4) |
| `account_name` | GL account name |
| `voucher_code` | Voucher number — use to pair debit/credit rows |
| `entity_type` | Type of entity (owner, vendor, well, etc.) |
| `entity_code` | Entity identifier |
| `entity_name` | Entity display name |
| `journal_date` | Transaction date |
| `accrual_date` | Accounting period date |
| `gl_description` | Transaction description |
| `net_amount` | Amount — debits positive, credits negative |

**AR Cross-Clear filter:**
```sql
WHERE main_account IN ('501', '130')
  AND sub_account IN ('1', '2', '3', '4')
  AND (gl_description LIKE '%Net Revenue Against A/R%' OR gl_description LIKE '%AR Cross Clear%')
```

---

## Revenue — `GOLD_FINANCIAL`

### `GOLD_FCT_OWNER_REVENUE_DETAIL`
**ODA equivalent:** Report ORD (Owner Revenue Detail)
**Grain:** One row per owner revenue distribution line item

| Column | Description |
|--------|-------------|
| `id` | Natural key |
| `company_code` | Operating company |
| `owner_id` / `owner_code` / `owner_name` | Owner |
| `fid` | Owner federal tax ID |
| `well_code` / `well_name` | Associated well |
| `production_date` / `production_year` / `production_month` | Production period |
| `product_code` / `product_name` / `product_full_name` | Product |
| `decimal_interest` | Owner decimal interest |
| `interest_type_full_name` | WI, ORRI, NPI, etc. |
| `net_volume` | Net production volume |
| `net_value` | Gross revenue value |
| `paid_amount` | Amount paid to owner |
| `total_tax` | Severance and production taxes |
| `net_deductions` | Net deductions |
| `amount_suspended` | Amount held in suspense |
| `netted_amount` | Amount netted against AR |
| `balance_amount` | Final balance |
| `item_suspense` / `owner_suspense` / `well_suspense` | Suspense reasons |

### `GOLD_DIM_REVENUE_CHECK_REGISTER`
**ODA equivalent:** Report 430 (Revenue Check Register)
**Grain:** One row per revenue check

| Column | Description |
|--------|-------------|
| `company_code` / `company_name` | Operating company |
| `check_number` | Check / transaction number |
| `check_date` | Date issued |
| `check_type` / `check_type_name` | Payment type |
| `check_amount` | Payment amount |
| `main_account` / `sub_account` / `account_name` | GL account |
| `voucher_code` | GL voucher reference |
| `entity_code` / `entity_name` | Payee (owner entity) |
| `void_date` | Date voided (null if not voided) |
| `reconciled` | `YES` if reconciled |
| `voided` | `YES` / `NO` |

---

## Accounts Payable — `GOLD_FINANCIAL`

### `GOLD_DIM_AP_CHECK_REGISTER`
**ODA equivalent:** Report 330 (AP Check Register)
**Grain:** One row per AP check

| Column | Description |
|--------|-------------|
| `company_code` / `company_name` | Operating company |
| `check_number` | Check / transaction number |
| `check_date` | Date issued |
| `check_type` / `check_type_name` | Payment type |
| `check_amount` | Payment amount |
| `main_account` / `sub_account` / `account_name` | GL account |
| `voucher_code` | GL voucher reference |
| `entity_code` / `entity_name` | Payee (vendor entity) |
| `void_date` | Date voided |
| `reconciled` | `YES` if reconciled |
| `voided` | `YES` / `NO` |

---

## JIB — `GOLD_FINANCIAL`

### `GOLD_FCT_JIB`
**ODA equivalent:** Report 720 (JIB Prelist), JIBR (Invoice Register)
**Grain:** One row per JIB billing line item

---

## AFE — `GOLD_FINANCIAL`

### `GOLD_DIM_AFE` + `GOLD_FCT_AFE_BUDGET`
**ODA equivalent:** AFE Summary
**Grain:** AFE master + budget vs actual line items

---

## Production — Schema TBD

### `GOLD_FCT_PRODUCTION_MONTHLY`
**ODA equivalent:** Report PVR (Production Volume)
**Grain:** One row per well per product per month

---

## Dimension Models

| Model | Schema | Description |
|-------|--------|-------------|
| `GOLD_DIM_WELL` | `GOLD_ASSET_HIERARCHY` | Well master — API#, name, status, operator |
| `GOLD_DIM_OWNER` | `GOLD_LAND` | Owner master — name, address, interest types |
| `GOLD_DIM_VENDOR` | `GOLD_SUPPLY_CHAIN` | Vendor master |
| `GOLD_DIM_COMPANY` | `GOLD_ORGANIZATION` | Company master |
| `GOLD_DIM_ENTITY` | `GOLD_ORGANIZATION` | Entity master (shared) |
| `GOLD_DIM_PURCHASER` | `GOLD_MARKETING` | Purchaser master for revenue |
| `GOLD_DIM_AFE` | `GOLD_FINANCIAL` | AFE master |

---

## Gold Model Status Summary

| Status | Count | Models |
|--------|-------|--------|
| ✅ Exists | 9 | AR aging summary/detail, GL details, AP check register, AP payment, JIB, revenue check register, owner revenue detail, production monthly, AFE |
| 🔶 Staging/intermediate only | 8 | AP detail, AP summary, GL detail (full), trial balance, voucher audit, JIB detail, purchaser receipts, revenue suspense (440) |
| ❌ Needs to be built | 5 | Property sub-ledger, JADE, JIB suspense, revenue missing check, revenue AR |
