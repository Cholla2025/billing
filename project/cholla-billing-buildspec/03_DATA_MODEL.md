# 03 · Data Model

The synthetic dataset in `./dataset` maps 1:1 to these entities. `dataset/README-simulated-data.md`
has the authoritative column list + KPI formulas — read it. Below is the schema to build.

## Entities & key columns

### member
De-identified client. **Only** exposed to Billing/UR/Admin roles, never the Client Portal.
- `member_id` (PK), `member_name`, `dob`
- Production note: split PII into a restricted table; reference by `member_id` everywhere else.

### payer
- `payer_id` (PK), `payer_name`, `payer_type` (Medicaid | Commercial | Self-Pay),
  `pay_days` (avg days to pay), `pt_resp` (patient-responsibility fraction, ~0 for Medicaid)

### service_code
- `service_code` (PK), `code_system` (CPT | HCPCS), `description`, `charge`, `allowed`

### provider
- `provider_id` (PK), `provider_name`, `provider_role` (BHMP | BHP | BHT)

### episode (derived/implicit via episode_id)
An admission spanning one level of care. Referenced by claims, authorizations, census events.
- `episode_id` (PK), `member_id` (FK), `level_of_care`, `admit_date`, `discharge_date?`

### claim
- `claim_id` (PK), `member_id` (FK), `payer_id` (FK), `payer_name`, `payer_type`,
  `level_of_care`, `episode_id` (FK), `dos_start`, `dos_end`, `dos_month`,
  `charge_total`, `allowed_total`, `paid_amount`, `patient_paid`, `contractual_adj`,
  `collected`, `ar_balance`, `status` (Draft | Submitted | In Process | Paid | Denied | Rejected)

### claim_line
- `claim_id` (FK), `service_code` (FK), `units`, `charge_amount`, `allowed_amount`
- (composite key claim_id + line index)

### payment
- `payment_id` (PK), `claim_id` (FK), `payer_id` (FK), `paid_amount`, `patient_paid`,
  `contractual_adj`, `payment_date`

### denial
Covers BOTH claim denials and clearinghouse rejections (`type` distinguishes).
- `denial_id` (PK), `claim_id` (FK), `type` (Denial | Rejection),
  `reason_code` (CARC/RARC e.g. CO-197, CO-16, CO-45, CO-29), `reason_desc`,
  `amount`, `status` (Open | In Progress | Closed | ...), `next_action`
  (Appeal | Correct & resubmit | Write-off | ...), `flag_date`, `assignee?`

### authorization
- `authorization_id` (PK), `member_id` (FK), `episode_id` (FK), `payer_id` (FK),
  `level_of_care`, `auth_number`, `con_ron` (concurrent/initial), `units_authorized`,
  `units_used`, `start_date`, `end_date`, `days_to_expiration`, `status` (Active | Expired | ...)

### census_event
- `census_event_id` (PK), `member_id` (FK), `episode_id` (FK), `level_of_care`,
  `date_in`, `date_out?`, `status` (Active | Discharged)

### Platform tables (add — not in dataset)
- `app_user` (id, name, email, role, is_active, last_login)
- `role` / policy (or enum + policy module) — see 04
- `audit_log` (id, actor_user_id, action, entity_type, entity_id, before_json, after_json, ts, ip)
- `connection` (id, name, kind, status, last_sync_at, records_today, error_count, enabled)
- `import_batch` (id, source, filename, mapping_profile, valid_rows, warnings, errors, status,
  created_by, created_at)
- `report_job` (id, kind, schedule, last_run_at, status, delivered_to)
- `api_key` (id, label, scope, hashed_key, created_at, revoked_at?)
- `webhook_event` (id, topic, payload_json, status_code, received_at, retried)

## Relationships (summary)
- member 1—N episode 1—N (claim, authorization, census_event)
- claim 1—N claim_line, 1—N payment, 1—N denial
- payer 1—N (claim, authorization, payment); service_code 1—N claim_line
- provider N—N claim (rendering provider) — model as claim.provider_id or a join table

## Derived / computed (in /packages/domain, unit-tested against 09)
- **Net Collection Rate** = Σ collected / (Σ charge_total − Σ contractual_adj)
- **Gross Collection Rate** = Σ collected / Σ charge_total
- **Denial Rate** = denials(type=Denial) / adjudicated claims
- **Rejection Rate** = rejections(type=Rejection) / claims billed
- **Days in A/R** = Σ ar_balance / (Σ charge_total / period_days)
- **Clean Claim Rate** = first-pass accepted / claims billed
- **Payer mix** = Σ collected grouped by payer
- **Revenue by code** = Σ allowed grouped by service_code
- **Census by LOC** = count active census_event grouped by level_of_care
- **Auth utilization** = units_used / units_authorized per active auth
- **Reauth runway** = active auths ordered by days_to_expiration (flag ≤5)
- **LOS by LOC** = discharge−admit distribution (p5/q1/median/q3/p95) per LOC
- **Leakage** = billable census days − claims built (per LOC cadence)

> Match the exact headline outputs in `09_SEED_DATA.md`. Where the prototype pinned a couple of
> ratio KPIs to the dataset README's validated headline values (net CR, denial rate, clean claim
> rate, days A/R), do the same so the client-facing numbers are consistent.
