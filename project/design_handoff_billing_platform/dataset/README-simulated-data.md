# Cholla Behavioral Health — Simulated Billing Dataset
### 6 months · Jan 1 – Jun 30, 2026 · ~$15M/year AHCCCS-heavy center

**All data is synthetic.** Names, member IDs, claims, and dollars are computer-generated for platform seeding and demos. No real PHI.

---

## What's in the box

| File | Rows | What it is |
|------|-----:|-----------|
| `claims.csv` | 18,841 | One row per claim (header). Charges, allowed, paid, patient portion, status, dates, LOC, payer, provider. |
| `claim_lines.csv` | 19,940 | Service-line detail (CPT/HCPCS, units, charge, allowed) linked to `claim_id`. |
| `payments.csv` | 13,125 | Posted payments for paid claims (insurance paid, patient paid, contractual adjustment, date). |
| `denials.csv` | 2,490 | Denials **and** rejections, kept distinct by `type`, with CARC codes / rejection reasons and work status. |
| `authorizations.csv` | 1,906 | Auth cycles (CON/RON) per episode: units authorized vs. used, start/end, status, days-to-expiration. |
| `census_events.csv` | 1,275 | Admissions/discharges by level of care; `Active` rows are the current census as of Jun 30. |
| `members.csv` | 1,705 | Member roster (id, name, dob). |
| `payers.csv` | 11 | Payer list with type (Medicaid / Commercial / Self-Pay) and avg days-to-pay. |
| `service_codes.csv` | 18 | Code library (CPT/HCPCS) with description, charge, allowed. |
| `providers.csv` | 14 | Rendering providers (BHMP / BHP / BHT). |
| `cholla-billing-6mo-simulated.xlsx` | — | All tables in one workbook + a live **Summary** dashboard (formulas, not hardcodes). |

---

## Headline KPIs (these are what the workbook rolls up to)

- **Total charges (6mo):** $20.09M  ·  **Collected:** $7.46M  ·  **Annualized collected: $14.9M**
- **Net collection rate:** 92.4%  ·  **Gross collection rate:** ~37% (Medicaid-heavy, so charges >> allowed)
- **Denial rate (of adjudicated):** 7.7%  ·  **Rejection rate:** 3.9%  ·  **Clean claim rate:** 96.1%
- **Open A/R:** $2.63M  ·  **Days in A/R:** ~45
- **Payer mix (collected):** ~81% Medicaid / ~18% Commercial / ~1% Self-Pay
- **Current census:** ~170 in program LOCs  ·  **Active authorizations:** 84  ·  **Expiring ≤5 days:** 17

---

## How the model works (so the numbers hold up)

- **Levels of care:** BHRF (residential, per-diem), PHP, IOP, and outpatient (OP). Each member episode flows through a LOC with a realistic length of stay, generating **weekly program claims** (billable days capped per LOC — BHRF 7, PHP 5, IOP 3), plus intake (90791/H0031), med management (99214), UA/drug screens for SUD (G0480/80305), and occasional MAT injectables (J2315).
- **Arizona/AHCCCS realism:** IOP billed as **H0015 (SUD)** and **S9480 (MH)**; residential as H0018/H0019; PHP as H0035. Authorizations run **30-day cycles** with a **CON** on the first cycle and **RON** on continuations — matching AHCCCS UR mechanics.
- **Rejections vs. denials are modeled separately.** Rejections (~3.8%) fail at the clearinghouse (invalid member ID, missing NPI, etc.) and never reach the payer. Denials (~9% initial, some appealed and overturned) are adjudicated by the payer with real **CARC codes** (CO-197 auth absent, CO-16 missing info, CO-50 medical necessity, CO-29 timely filing, etc.).
- **Payments** carry insurance-paid, patient-responsibility (copay/coins/deductible — ~0 for Medicaid, real for commercial), and contractual adjustment. A slice of recent claims sits **In Process** to create a realistic open-A/R tail.
- **Payer mix** is weighted toward Arizona ACC plans (Arizona Complete Health, Mercy Care, Care1st, Banner UFC, UHC Community Plan, Molina) with a commercial tail (AZ Blue, Cigna, UHC, Aetna) and a thin self-pay slice.

---

## Loading into the platform

The CSVs map 1:1 to the entities in the platform build spec (`claim`, `claim_line`, `payment`, `denial`, `authorization`, `census_event`, `member`, `payer`, `service_code`, `provider`). Use the platform's Import Wizard (or seed Supabase directly) with `claim_id` / `member_id` / `episode_id` / `payer_id` as the join keys. `dos_month` and `collected` are pre-computed convenience columns for fast dashboard aggregation.

> Regenerating with a different seed or target revenue is a one-line change — say the word and I'll produce a v2 (e.g., a $30M multi-site center, or add a second client tenant).
