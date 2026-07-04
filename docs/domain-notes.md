# Domain Notes — AHCCCS Behavioral Health Billing & UR

Enough domain to make the numbers correct. Data is synthetic (Jan 1 – Jun 30 2026).

## Payers
Arizona Medicaid (**AHCCCS**) is administered by managed-care plans: AZ Complete Health (AzCH-CCP),
Mercy Care, Care1st, Banner UFC, UHC Community Plan, Molina AZ. Commercial: AZ Blue, Cigna, UHC
Commercial, Aetna. Plus Self-Pay. Medicaid plans ≈ 76% of collections and carry ~$0 patient
responsibility; commercial carries copay/coinsurance/deductible — the UI hides the
patient-responsibility panel when a Medicaid payer is selected.

## Levels of care (LOC)
OP (outpatient, no PA) · IOP (intensive OP, PA ~30-day) · PHP (partial hospitalization, PA ~30-day)
· BHRF (behavioral-health residential, PA required) · Inpatient (acute, PA required). Per-diem HCPCS
codes drive most revenue: H0018 BHRF SUD, H0019 BHRF MH, H0035 PHP, H0015 IOP-SUD, S9480 IOP-MH.

## Authorizations & UR
Prior authorization (pre-service) and **concurrent review** (during service) gate billable days.
An **auth denial** (utilization-management / medical-necessity) is a *different stage* from a
**claim denial** (adjudication after submission) — the UR dashboard makes this distinction
explicit. Reauth runway = active auths ordered by days-to-expiration; anything ≤5 days is flagged
(17 in the dataset) because expired auths create unbillable days.

## Denials & rejections
- **Rejection** = stopped at the clearinghouse (277CA/999) before adjudication — e.g. invalid
  member ID, missing NPI. Fixed and resubmitted; doesn't count against denial rate.
- **Denial** = adjudicated and denied by the payer, carrying a **CARC/RARC** reason. Top drivers:
  CO-197 (auth absent, the #1 preventable), CO-16 (claim lacks info), CO-50 (not medically
  necessary), CO-97 (bundled).

## KPI formulas (`src/domain`)
- **Net Collection Rate** = Σ collected / (Σ charges − Σ contractual adjustments) — pinned to the
  validated 92.4%.
- **Gross Collection Rate** = Σ collected / Σ charges (computed → 37.1%).
- **Denial Rate** = denials / adjudicated claims (pinned 7.7%). **Rejection Rate** = rejections /
  claims billed (pinned 3.9%).
- **Days in A/R** = Σ AR balance / (Σ charges / period days) — pinned 45.
- **Clean Claim Rate** = first-pass accepted / billed (pinned 96.1%).
- **Payer mix** = Σ collected by payer (computed). **Revenue by code** = Σ allowed by service code.
- **Census by LOC** = count active census by LOC (computed → IOP 120 / BHRF 62 / PHP 32).
- **Auth utilization** = units_used / units_authorized per active auth.
- **Leakage** = billable census-days (24,398) − claims built (18,841) = 5,557 unbilled days.

See `docs/DECISIONS.md` for which KPIs are computed live vs. pinned and why.
