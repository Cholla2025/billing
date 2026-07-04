# 09 · Seed Data

All numbers are **synthetic** (Jan 1 – Jun 30, 2026). The raw source is `./dataset` (CSVs + xlsx
+ `README-simulated-data.md`). `reference/cholla-data.js` is the **precomputed aggregate output**
the dashboards expect — your API must reproduce this shape and these exact numbers.

## How to seed
1. Load each CSV in `./dataset` into its table (03_DATA_MODEL.md). File → table:
   `members.csv → member`, `payers.csv → payer`, `service_codes.csv → service_code`,
   `providers.csv → provider`, `claims.csv → claim`, `claim_lines.csv → claim_line`,
   `payments.csv → payment`, `denials.csv → denial`, `authorizations.csv → authorization`,
   `census_events.csv → census_event`.
2. Derive `episode` from the `episode_id` references (or synthesize from claims/census/auth).
3. Create platform tables + seed `app_user` (one per role — see 04), `connection` (5 sources),
   a few `api_key`, `import_batch`, `report_job`, and `webhook_event` samples so the Connections/
   Admin screens look live.
4. Compute the aggregates in `/packages/domain` and expose via `/metrics/*`. Unit-test against
   the golden values below.

## Golden headline KPIs (must reproduce exactly)

### Billing Overview
| Metric | Value |
|--------|-------|
| Claims Billed | **18,841** |
| Total Charges | **$20,092,345** (~$20.09M) |
| Total Collected | **$7,462,475** (~$7.46M; ≈$14.9M annualized) |
| Net Collection Rate | **92.4%** |
| Gross Collection Rate | 37.1% |
| Denial Rate | **7.7%** |
| Rejection Rate | **3.9%** |
| Clean Claim Rate | **96.1%** |
| Days in A/R | **45** |
| Open A/R | **$2,633,304** (~$2.63M) |

> Note: a few ratio KPIs (net CR, denial rate, clean claim rate, days A/R) are pinned to the
> dataset README's validated headline values rather than the raw open-A/R-tail computation, so
> the client-facing numbers stay consistent. Do the same. `grossCR`, charges, collected, claim
> counts, and all chart series are computed directly from the CSVs.

### Utilization Review
| Metric | Value |
|--------|-------|
| Active Authorizations | **84** |
| Units / Days Remaining | **704** |
| Auths Expiring ≤5 Days | **17** |
| Auth Denial Rate | **2.5%** |
| Avg LOS · IOP | **45 days** |
| Current Census | **214** |

### Work-queue counts (Team Ops tab badges)
Claims **18,841** · Denials **1,763** · Rejections **727** · Payments **13,125** · Auths **84**.

### Census vs. claims (leakage view)
Billable program-days **24,398** · Claims built **18,841** · **Unbilled 5,557**
(≈ $1.3M allowed revenue at ~$235/day — display the computed dollar figure).

### Census by level of care
IOP **120** · BHRF **62** · PHP **32** (active).

## Chart series (computed — verify against these)
**Payer mix (collected, 6-mo):** AZ Complete Health $1.66M · Mercy Care $1.28M · Care1st AZ
$950K · Banner UFC $892K · UHC Community $654K · AZ Blue $538K · UHC Commercial $431K · Cigna
$347K · Molina AZ $335K · Aetna $213K · Self-Pay $155K. (AHCCCS Medicaid plans ≈ 76% of total.)

**Denial reasons (CARC):** CO-197 Precert/authorization absent **456** · CO-16 Claim lacks
information **269** · CO-50 Not medically necessary **218** · CO-97 Service included in another
**167** · Other **653**. (Total ≈ 1,763.)

**Revenue by service code (allowed):** H0018 BHRF Residential SUD per diem $3.46M · H0035 PHP
per diem $2.43M · H0015 IOP SUD per diem $1.14M · H0019 BHRF Residential MH per diem $1.07M ·
S9480 IOP MH per diem $673K · 99214 E/M med management $440K · 90791 Psychiatric diagnostic eval
$339K.

**Also computed:** monthly claims/charges/collected, monthly denial+rejection trend, patient-
responsibility split (insurance vs. patient), auth utilization per active auth, reauth runway
(by days-to-expiration, ≤5 flagged), LOS box-plots per LOC.

## Settings reference data (from dataset)
11 payers · 18 service codes · 14 rendering providers. Load verbatim into Settings.

## Acceptance
A golden-file test compares `/metrics/billing` and `/metrics/ur` output to
`reference/cholla-data.js`. They must match. If you re-seed with new data, recompute the same
shape — the front-end doesn't change.
