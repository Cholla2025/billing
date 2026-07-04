# 01 · Product Overview

## What this is
A behavioral-health **revenue-cycle + utilization-review intelligence platform** for Cholla
Behavioral Health. It turns raw EMR/clearinghouse data into (a) a clean client-facing picture of
billing health, (b) an automated leadership roll-up, and (c) a working cockpit for the billing
team to actually move claims, denials, payments, and authorizations.

## Who uses it (personas)
1. **Cholla Leadership / Client Viewer** — executives/owners at the treatment center. Want to
   know: are we billing everything, getting paid, and where's the leakage? Read-only,
   de-identified aggregates. This is the **Client Portal**.
2. **Operations / Clinical Director** — wants org-wide roll-ups, automated report delivery, and
   the UR picture (authorizations, census, reauth runway, length of stay). Mostly automated.
   This is the **Leadership / Operations** surface.
3. **Billing Manager** — owns the revenue cycle. Full access to claims, denials, rejections,
   payments, authorizations, imports, connections, settings, users. Can post payments, write
   off, appeal, reassign work, add users, edit payers/codes.
4. **Junior Biller** — does the day-to-day queue work under the manager. Scoped access: can work
   claims/denials/rejections and log payments/denials, but **cannot** write off above a
   threshold, change settings, manage users, or delete records. All actions audited.

> The three "surfaces" the client asked for = **Client Portal**, **Leadership/Operations**, and
> **Billing Workspace** (shared by Billing Manager + Junior Biller with different permissions).

## The three surfaces at a glance
### 1) Client Portal (customer site)
- De-identified billing health: KPIs (claims billed, charges, collected, net collection rate,
  denial/rejection rate, days in A/R, clean claim rate), monthly trends, payer mix, denial
  reasons, revenue by service code, and the "claims built vs. census" leakage view.
- No member names, no work queues. Export a board-ready PDF.

### 2) Leadership / Operations (automated)
- Org-wide roll-ups + the **Utilization Review** dashboard (active authorizations, units
  remaining, auths expiring ≤5 days, auth denial rate, census by level of care, auth
  utilization, reauth runway, length of stay).
- **Automation**: reports pulled from the EMR on a schedule, denial/auth webhooks, scheduled
  report delivery. Connections screen shows the health of every feed.

### 3) Billing Workspace (billing team)
- Work queues: Claims, Denials, Rejections, Payments, Authorizations (with real counts).
- Entry tools: New Claim, Post Payment, Log Denial/Rejection, New/Update Auth.
- Import Wizard (CSV / 837 / 835 / clearinghouse export) with validation.
- Connections & Automations, Settings (payers, service codes, providers, levels of care, users,
  CARC reference), and Admin (system health, data-quality flags, audit log).
- **Two roles, one workspace**: Billing Manager (full) vs. Junior Biller (scoped). See 04.

## Domain context (get this right — see /docs/domain-notes.md)
- **AHCCCS/Medicaid-heavy**: ~75%+ of collections are Arizona Medicaid managed-care plans
  (Arizona Complete Health, Mercy Care, Care1st, Banner UFC, UHC Community, Molina). Medicaid
  patient responsibility ≈ $0; commercial plans (UHC, Aetna, Cigna, AZ Blue) carry copays/
  coinsurance/deductible.
- **Levels of care**: OP (outpatient), IOP (intensive outpatient), PHP (partial hospitalization),
  BHRF (residential), Inpatient. IOP/PHP/BHRF require prior authorization + concurrent review.
- **Two different "denials"**: an **authorization/UM denial** (medical-necessity stage) is NOT
  the same as a **claim denial** (adjudication stage). The UI must keep them distinct.
- **Key metrics**: Net Collection Rate = collected / (charges − contractual adj); Days in A/R =
  open A/R / (charges / period days); Clean Claim Rate = first-pass acceptance; leakage = billable
  census days not turned into claims.

## Success = 
A billing manager and a junior biller can log in, see role-appropriate screens, work a real
denial from the queue to resubmission, post a real payment, update an authorization before it
lapses, import an 835, and have leadership + the client portal reflect it — all on seeded
synthetic data that reproduces the exact KPIs in `09_SEED_DATA.md`, looking identical to the
prototype.
