# 11 · ADDITION SPEC — Billing & UR Operations Layer

> **Status:** Governing spec for milestones after the foundation. This is an ADDITION to the
> existing Cholla Billing & UR Intelligence Platform. **Do not replace, redesign, or restructure
> anything that exists.** Keep the current shell, navigation, roles, dashboards, data model,
> design system, and all existing screens exactly as they are. Extend them: add the new pages,
> modules, queues, integrations, and data entities below, wire them into the existing sidebar nav
> under the sections indicated, and reuse the existing components (`KpiCard`, `DataTable`,
> `StatusPill`, `EntryForm`, `ImportWizard`, `InsightBanner`, etc.). Where a new module touches an
> existing screen (e.g., adding a tab or a linked field), modify minimally and additively.

**Why this addition exists:** v1 built the reporting layer and basic entry. This layer adds the
day-to-day operating system a real billing and UR team runs: benefits verification, prior auth
submission, claim scrubbing, EDI automation, remittance posting, denial/appeal workflow,
concurrent review management, and live connections to the EMR (Sunwave or Kipu), Availity, and the
clearinghouse.

---

## PART 1 — NEW MODULES (Front of the revenue cycle)

### 1.1 VOB & Eligibility Center *(new page under Team Ops)*
The front door of the revenue cycle. Every admission starts here.

- **Eligibility check panel** — run a real-time eligibility inquiry (270/271) against a member +
  payer. Result card shows: coverage active Y/N, plan name, effective/term dates, behavioral
  health benefits, deductible (total/met/remaining), out-of-pocket max (total/met/remaining),
  copay/coinsurance by service type, carve-out flag (e.g., BH managed by Optum/Carelon/Magellan
  even when the medical plan is another payer), and whether prior auth is required by level of care.
- **VOB worksheet** — a structured, saveable verification-of-benefits record per member per
  episode: everything above plus policy holder info, payer phone reference number, rep name, call
  date/time, quoted benefits by LOC (detox/residential/PHP/IOP/OP), episode/day limits, exclusions,
  and free-text notes. Versioned — re-verifications create a new version, and the platform diffs
  versions to surface coverage changes.
- **Recurring re-verification engine** — automation rules: re-check eligibility (a) morning of
  admission, (b) every Monday for active census, (c) 1st of month for Medicaid members
  (redetermination risk). Failed/termed coverage raises a red alert on the member and the ops
  dashboard.
- **Medicaid redetermination tracker** — per AHCCCS member: renewal month, status, outreach log.
  Lapsed eligibility mid-episode is one of the biggest unbillable-day risks in this book of business.
- **Queue:** "Eligibility exceptions" — termed coverage, plan changes, carve-out mismatches,
  subscriber-not-found.

### 1.2 Prior Authorization Submission *(extends the existing Authorizations module — do not rebuild it)*
The existing auth tracking stays. Add the *request* side of the workflow:

- **Auth request builder** — create an authorization request tied to member + LOC + payer:
  requested units/days, clinical justification summary, attached clinical packet (see 3.2),
  submission method (Availity 278 API / payer portal / fax), and submission timestamp.
- **Request status pipeline** — Draft → Submitted → Pending Info → Approved → Partially Approved →
  Denied. Approved requests auto-create/extend the authorization record in the existing module.
- **Payer requirements library** *(Settings addition)* — per payer per LOC: is PA required, clinical
  packet requirements, review cycle length, submission channel, UM fax/portal URL, and turnaround
  SLA. Pre-fills the request builder.
- **Auth denial path** — a denied auth request creates a UR denial record (distinct from claim
  denials) and offers two actions: *Schedule peer-to-peer* or *File appeal* (links to 2.4 and 1.4).

### 1.3 Concurrent Review Workspace *(new page under a new "UR" nav section; move the existing UR dashboard under this section too)*
The UR team's daily driver.

- **Review calendar** — every active episode's next concurrent review date on a week view. Reviews
  auto-scheduled from the payer requirements library (e.g., every 5–7 days residential, per auth
  cycle for IOP). Color: due today / overdue / upcoming.
- **Review prep card** (per review) — one screen the UR specialist works from on the call: member
  summary, LOC, days used vs. authorized, attendance/participation notes, med changes, treatment
  plan goals + progress, and the clinical packet. Fields for the call itself: payer case manager
  name, reference #, outcome (Approved N days / Denied / Pended), next review date.
- **Outcome logging** — approved days flow into the existing authorization record automatically.
  Denials trigger the peer-to-peer/appeal path.
- **Peer-to-peer manager** — schedule P2P calls (payer medical director + treating BHMP), track
  outcome (overturned / upheld / partial), and log the win rate per payer.
- **Criteria checklists** — ASAM dimensions (SUD) and severity-of-need checklists attachable to
  review prep; flags when documentation doesn't support the current LOC.
- **LOC transition planning** — step-down recommendation field (e.g., BHRF → IOP) with target date;
  creates the next LOC's auth request as a draft.

### 1.4 UR Denials & Appeals *(new tab inside the existing Denials queue — keep the claim denial workflow untouched)*
- Separate track for **UM/auth denials** (pre-service and concurrent) vs. claim denials.
- **Appeal builder** — per appeal: level (peer-to-peer → 1st level → 2nd level → external/state fair
  hearing), payer deadline (auto-computed from payer rules), required documents checklist, generated
  appeal letter draft (from a template + member/denial data), submission log, and outcome.
- **Deadline tracking** — appeal deadlines appear in the global alerts engine (Part 5). A missed
  appeal window is lost money; treat like auth expirations.

---

## PART 2 — NEW MODULES (Middle & back of the revenue cycle)

### 2.1 Claim Scrubbing & Validation Engine *(extends the existing claim workflow)*
Before a claim can move to Submitted, it passes a configurable rules engine:

- **Rule library** *(Settings addition)* — admin-manageable rules with severity (Block / Warn): auth
  on file & units available for DOS; provider credentialed with payer (see 4.1); documentation
  signed for all DOS (see 4.2); modifier/code combos valid for payer; timely filing window open;
  eligibility verified within N days; demographic completeness (DOB, member ID format per payer);
  duplicate DOS check.
- **Scrub results panel** on the claim: pass/fail per rule with fix links. Blocked claims sit in a
  "Scrub failures" queue.
- Seed ~25 sensible default rules; make all editable.

### 2.2 EDI & Remittance Automation *(extends Connections page)*
- **837 outbound** — batch generator: selected clean claims → 837P/837I batch, transmitted to
  clearinghouse (SFTP or API). Batch log with claim counts, control numbers, timestamps.
- **Acknowledgment tracking** — ingest 999/277CA responses; auto-flag rejected claims into the
  existing Rejections queue with the reason parsed.
- **835 ERA auto-posting** — ingest electronic remittances: auto-match to claims, post
  payment/adjustment/patient-responsibility lines, and write payment records into the existing
  payments table. **Exception queue** for unmatched or partial-match remits (wrong amount, unknown
  claim, takeback) requiring human review. Show auto-post rate as a KPI.
- **276/277 claim status polling** — scheduled status checks on submitted claims older than N days
  with no remit; status updates flow onto the claim record.
- **Paper EOB path** — upload + manual posting form for the payers that still mail.

### 2.3 Timely Filing & Follow-Up
- Per-payer **timely filing limits** in the payer settings (initial + corrected claim + appeal
  windows).
- Every claim shows a **filing countdown**; claims within 14 days of the limit escalate into a
  "Timely filing risk" queue and the alerts engine.
- **A/R follow-up worklists** — auto-generated by rule: no response in 30 days, partial payment,
  underpaid vs. expected (see 2.5), pending > 45 days. Assignable, with touch/notes log per claim
  (call payer, portal check, resubmitted) so follow-up history is auditable.

### 2.4 Claim Denial Workstation upgrades *(additive to the existing denial queue)*
- Add appeal-level tracking, appeal letter generation, and payer deadline fields (same appeal
  builder pattern as 1.4).
- Add **root-cause tagging** (front-end error / auth / clinical doc / payer error / credentialing)
  so the analytics can show *preventable* denial % — and a monthly denial-prevention insight on the
  client dashboard.

### 2.5 Expected Reimbursement & Contract Management *(new Settings section + claim field)*
- **Fee schedules per payer** — expected allowed amount per code per payer (seedable via CSV import).
- Claims compute **expected vs. actual paid**; underpayments beyond a tolerance auto-flag to an
  "Underpaid" worklist. This is a service differentiator most small billers can't show.
- Contract records: effective dates, rates version history, escalators, renewal reminders.

### 2.6 Patient Financial Module *(commercial/self-pay only; hidden for Medicaid, consistent with v1's Medicaid-aware UI)*
- Patient balance ledger per member (copay/coinsurance/deductible from remits), statement
  generation (PDF), payment recording, simple payment-plan tracking, and a small collections aging
  view. No card processing in scope — record-keeping only.

---

## PART 3 — INTEGRATIONS (extend the Connections page with these named connectors)

### 3.1 EMR Connectors — Sunwave and Kipu *(build both as configurable connector cards; a client uses one)*
Data pulled from the EMR (via API where available, else scheduled SFTP flat-file or webhook relay
through n8n):
- **Census sync** — admissions, discharges, LOC changes → auto-create/close census events and draft
  episodes.
- **Demographics & insurance** — member and policy data → members table + triggers a VOB task.
- **Charge/service feed** — rendered services (attendance, sessions, per-diem days) → draft claims
  or a charge-review queue (see 4.2).
- **Documentation status** — note signed/unsigned flags per DOS → feeds the scrub engine's
  documentation rule.
- Connector settings: direction, entity mapping (reuse v1's field-mapping profiles), sync cadence,
  and a per-sync reconciliation report (EMR census vs. platform census — surface mismatches, don't
  silently overwrite).

### 3.2 Availity Connector *(REST APIs, OAuth 2.0 client-credentials)*
- **Coverages API (270/271)** → powers the Eligibility Center (1.1).
- **Authorizations API (278)** → powers electronic auth submission (1.2) for payers that support it.
- **Claim Status API (276/277)** → powers status polling (2.2).
- Config: client ID/secret vault, payer ID mapping table, sandbox/production toggle, request log
  with response times and error codes.

### 3.3 Clearinghouse Connector *(generic — works for Availity Essentials, Waystar, Change/Optum, Office Ally)*
- SFTP in/out folders for 837 / 835 / 999 / 277CA, file-naming conventions, PGP option,
  transmission log, and replay.

### 3.4 Payer Portal Tracker *(manual-work capture, not automation)*
- A lightweight registry of payer portals (URL, login owner, MFA note) and a "portal task" type in
  worklists so time spent in AzCH/Mercy Care portals is tracked and reportable. Flag candidates for
  future RPA.

### 3.5 n8n Orchestration *(extends v1's webhook section)*
- Publish inbound webhook contracts for: eligibility-result, census-event, charge-batch,
  remit-file-received, auth-status-change. Document sample payloads on the Connections page so
  workflows on the Hetzner n8n instance can be wired without guesswork.

---

## PART 4 — OPERATIONAL BACKBONE

### 4.1 Credentialing & Payer Enrollment Tracker *(new page under Admin)*
- Per provider per payer: enrollment status (Not enrolled / Submitted / In process / Active / Term),
  effective date, revalidation date, CAQH attestation date, NPI/taxonomy, notes.
- Feeds the scrub engine: **block claims where rendering provider isn't active with the payer for the
  DOS** — a silent killer of clean-claim rates.
- Alerts for revalidations and CAQH re-attestations due within 30 days.

### 4.2 Charge Capture & Billing Census *(new queue under Team Ops)*
- Daily grid: census (from EMR sync or platform census) × expected billable services vs. charges
  actually created, with documentation-signed status per DOS.
- Unsigned-note and missed-charge flags — this operationalizes v1's "claims built vs. census"
  leakage metric into a fix-it-today worklist instead of a retrospective chart.

### 4.3 Alerts & Task Engine *(global, extends v1)*
- Central rules: auth expiring ≤5 days, appeal deadline ≤7 days, timely filing ≤14 days, eligibility
  termed on active census, unsigned notes >48h, ERA exception unworked >3 days, credentialing lapse.
- Each alert creates an assignable task with SLA; a "My work" view per user; digest summary tile on
  the Ops dashboard.

### 4.4 New/updated roles
- Add **VOB/Admissions Specialist** (Eligibility Center + VOB worksheets), **UR Specialist** gains
  the Concurrent Review Workspace, **Biller** gains scrub/EDI/follow-up queues, **Billing Manager**
  gains contract mgmt, credentialing, and rules administration. Client Viewer stays read-only.

### 4.5 New data entities *(additive to the v1 schema)*
`eligibility_check` (member, payer, request/response snapshot, status, checked_at) · `vob_worksheet`
(versioned) · `auth_request` (links to authorization on approval) · `concurrent_review` (episode,
due date, outcome, next date, payer contact) · `peer_to_peer` · `appeal` (level, deadline, status,
letter ref) · `scrub_rule` + `scrub_result` · `edi_batch` + `edi_file_log` · `remit` + `remit_line`
+ `remit_exception` · `fee_schedule` + `contract` · `credentialing_record` · `charge_capture_row` ·
`task` + `alert` · `patient_statement` + `patient_payment`.

### 4.6 New reporting *(add as panels/tabs to the existing dashboards — do not rebuild them)*
- **Client UR dashboard additions:** auth approval rate, average days approved per review,
  concurrent review on-time %, P2P win rate, appeal overturn rate + dollars recovered, denial
  root-cause mix.
- **Ops dashboard additions:** ERA auto-post rate, scrub failure rate by rule, timely-filing saves,
  A/R touches per claim, biller worklist throughput, eligibility exception count.
- All new panels follow the v1 visual standard: KPI cards, real charts, bold one-line insight
  beneath each.

---

## PART 5 — BUILD ORDER FOR THIS ADDITION
1. Data entities + Settings (payer requirements library, fee schedules, scrub rules, credentialing)
2. Eligibility Center + VOB worksheets
3. Scrub engine + charge capture queue
4. EDI/ERA automation + exception queue + timely filing
5. Auth request builder + concurrent review workspace + P2P/appeals
6. EMR/Availity/clearinghouse connector cards + n8n webhook contracts
7. Alerts/task engine + new report panels

**Reminders:** keep the Cholla design system; keep every v1 screen intact; Medicaid-aware UI rules
apply everywhere new; all new create/edit/delete actions log to the existing audit trail; PHI stays
out of URLs and client-role aggregate views.
