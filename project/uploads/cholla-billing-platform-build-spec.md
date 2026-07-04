# Cholla Behavioral Health — Billing & UR Intelligence Platform
### Claude Design Build Spec (paste-ready)

> **Instruction to Claude Design:** Build a complete, multi-role operational web platform per this spec. **Use the existing Cholla Behavioral Health design system / brand guide already established in this workspace** for all color, type, logo, and component styling. If no Cholla brand tokens are loaded, fall back to a clinical, trustworthy palette (deep teal/green primary, warm neutral surfaces, high-contrast text) and a clean sans-serif — but prefer the loaded Cholla guide. Every screen must feel like one product, not a template. Data-heavy screens follow the rich-visual standard below: KPI cards with large bold numbers, real charts (bar, line, box, donut), interactive view-switchers, and a bold one-line headline insight under each visual.

---

## 1. Product summary

A HIPAA-conscious billing and utilization-review intelligence platform for a behavioral health billing service (Phoenix Creative Works / ManageAI) and its client, **Cholla Behavioral Health**. It has three faces:

1. **Client view** — read-only dashboards where Cholla leadership sees billing performance and UR/authorization health.
2. **Team ops view** — where the billing team enters, imports, and manages claims, denials, payments, and authorizations.
3. **Platform admin** — settings, users, payers, codes, branding, and the connections layer (manual, API, automation).

Data enters three ways: **manual entry**, **CSV/batch import**, and **API/automation** (n8n webhooks, clearinghouse/EHR feeds).

---

## 2. Roles & access model

| Role | Sees | Can do |
|------|------|--------|
| **Client Viewer** (Cholla leadership) | Client dashboards, UR dashboard, exportable reports | Read + export only. No PHI beyond what's needed; prefer aggregates. |
| **Billing Team** (PCW/ManageAI) | Everything in ops + client dashboards | Create/edit claims, denials, payments, authorizations; run imports |
| **UR Specialist** | UR dashboard + authorization entry | Manage authorizations, reauth queue, LOC/census |
| **Platform Admin** | All screens incl. Settings & Connections | Manage users, payers, code sets, branding, integrations, audit log |

- Auth via **SSO (Microsoft Entra ID)** as primary, with email/password fallback.
- **Role-based routing**: after login, users land on their default screen (Client → Client Dashboard; Team → Ops Dashboard; Admin → Admin Home).
- **Audit logging** on every create/edit/delete and every export.

---

## 3. HIPAA / data-handling directives (apply everywhere)

- No PHI in URLs, logs, or query strings. Reference patients by internal ID, not name, in shared/aggregate views.
- Client dashboards default to **de-identified aggregates**. Any drill-down to member-level data is gated to Billing/UR/Admin roles only.
- Session timeout + re-auth on sensitive actions. Audit trail is immutable and exportable.
- Assume the backend is **Supabase (Postgres) + Vercel** under a BAA; design the UI so PHI fields are clearly flagged and access-controlled.

---

## 4. Global UI shell

- **Left sidebar nav** (collapsible), **top bar** with org switcher (future multi-client), date-range picker (applies globally: Today / 7d / 30d / MTD / QTD / Custom), and user menu.
- **Date range is a global control** — every dashboard respects it.
- **Payer filter** and **level-of-care filter** available on all data screens.
- Reusable components: `KpiCard`, `TrendChart`, `BreakdownBar`, `DonutSplit`, `DataTable`, `InsightBanner` (the bold headline line under each visual), `EntryForm`, `ImportWizard`, `StatusPill`.

---

## 5. PAGES

### 5.1 Login page
- Centered card on a branded background. **Cholla logo** top of card.
- Primary button: **"Sign in with Microsoft"** (Entra ID SSO).
- Secondary: email + password with "forgot password".
- Small footer: "Powered by Phoenix Creative Works / ManageAI" + HIPAA/security note.
- Subtle, professional motion only. No PHI, no marketing clutter.

---

### 5.2 Client Dashboard — Billing Overview *(read-only)*
The default client landing screen. Respects global date range + payer/LOC filters.

**KPI card row (large bold numbers, with period-over-period delta arrows):**
- Claims Billed
- Total Charges ($)
- Total Collected ($)
- Net Collection Rate (%)
- Denial Rate (%)
- Rejection Rate (%)
- Days in A/R
- Clean Claim Rate (%)

**Visual blocks (each with an InsightBanner headline underneath):**
1. **Claims volume over time** — line/bar with a Day / Week / Month toggle. Insight e.g. *"Claim volume up 12% vs. prior 30 days, driven by IOP intakes."*
2. **Charges vs. Collected** — grouped bars by period + a running collected-line. Insight = gross vs. net gap.
3. **Denials & Rejections** — stacked bar over time + a donut of **denial reasons (CARC/RARC)**. Two clearly separated metrics: rejections (clearinghouse) vs. denials (payer). Insight = top preventable driver.
4. **Patient responsibility split** *(auto-hides when payer = Medicaid/AHCCCS)* — two buckets: insurance paid vs. patient portion (copay + co-insurance + deductible).
5. **Payer mix** — donut/bar of collections by payer.
6. **Revenue by service code** — bar of top CPT/HCPCS (90791, 90837, H0015, S9480, etc.).
7. **Claims Built vs. Census** — the leakage view: census days vs. billed claims, with an unbilled-days callout. Insight = dollars potentially left on the floor.

**Export**: "Export report" (PDF + CSV) respecting current filters.

---

### 5.3 Client Dashboard — Utilization Review / Authorizations *(read-only)*
The Arizona-specific differentiator.

**KPI row:**
- Active Authorizations
- Auth Units/Days Remaining (aggregate)
- **Auths Expiring ≤5 Days** (highlighted / red when > 0)
- Authorization Denial Rate (%)
- Avg Length of Stay by LOC
- Current Census

**Visual blocks:**
1. **Census by Level of Care** — bar: Outpatient / IOP / PHP / BHRF (residential) / Inpatient.
2. **Authorization utilization** — per active auth: units authorized vs. used vs. remaining (horizontal progress bars). Highlight over/under-utilization.
3. **Reauth runway** — timeline/Gantt of auths by expiration date; anything inside 5 days flagged. This is the "don't lose billable days" view (Arizona IOP auths run ~30-day cycles; CON initial / RON continuation).
4. **Authorization denials vs. claim denials** — clarify these are different stages (medical-necessity/UM vs. claim adjudication).
5. **Length of stay by LOC** — box plot or distribution.

InsightBanner examples: *"3 IOP auths lapse Friday — 3 members at risk of unbillable days."*

---

### 5.4 Team Ops Dashboard *(Billing/UR/Admin)*
Where work gets entered and worked. Two zones: a **work queue** and **entry tools**.

**Work queues (tabbed tables with StatusPills):**
- Claims (Draft / Submitted / Accepted / Rejected / Denied / Paid)
- Denials to work (with reason, payer, $ , age, assignee)
- Rejections to fix (clearinghouse errors, resubmit action)
- Payments to post
- Authorizations (Active / Expiring / Expired / Pending)

**Entry tools (all three ingestion paths live here):**
- **Manual entry forms** (see §6): New Claim, Post Payment, Log Denial/Rejection, New/Update Authorization.
- **Import Wizard** — upload CSV/835/837 or clearinghouse export → map columns → validate → preview → commit. Show row-level validation errors before commit.
- **Automation status** — live tiles showing last sync from each connected source (clearinghouse, EHR, n8n webhook) with timestamp, record counts, and error flags. Link to Connections page.

Bulk actions: assign, resubmit, mark worked, export.

---

### 5.5 Connections & Automations *(Admin)*
The integration control room.

- **Connected sources** cards: Clearinghouse, EHR/practice mgmt, n8n automations, Make.com, manual. Each shows: status, last sync, records ingested, error count, toggle.
- **API keys** — generate/revoke keys for inbound data; show endpoint URLs and a sample payload for claims/payments/auths.
- **Webhooks** — inbound webhook URLs (for n8n) with a recent-deliveries log and retry.
- **Field mapping** — per source, map incoming fields to the platform data model; save as reusable mapping profiles (reused by the Import Wizard).
- **Sync schedule** — for polling sources, set cadence; show next run.

---

### 5.6 Settings *(Admin)*
- **Organization & branding** — logo, colors (pull Cholla brand tokens), report header/footer.
- **Users & roles** — invite, assign role, deactivate; SSO domain config.
- **Payers** — manage payer list (AHCCCS plans: Arizona Complete Health, Care1st, etc.; commercial payers), each with type (Medicaid / Commercial / Self-pay) so the patient-responsibility panels toggle correctly.
- **Service codes** — CPT/HCPCS library with descriptions and default charges (90791, 90837, 90853, H0015, S9480, H0031, etc.).
- **Denial reason codes** — CARC/RARC reference list for categorizing denials.
- **Levels of care** — OP / IOP / PHP / BHRF / Inpatient definitions + auth rules (e.g., IOP = up to 30-day cycles, requires PA).
- **Report defaults** — default date range, which panels appear on the client view.

---

### 5.7 Admin Home / Platform Control Panel *(Admin)*
- System health: ingestion status, error counts, queue depths.
- User activity + audit log (searchable, exportable).
- Data quality flags: unmapped codes, unmatched payments, claims missing auth links.

---

## 6. Manual entry form fields

**New Claim:** member ID, DOB (masked), payer, level of care, service code(s), units, date(s) of service, rendering provider, charge amount, authorization link (optional), status.

**Post Payment:** claim ref, payer, paid amount, patient-responsibility amount (copay/coins/deductible split), payment date, adjustment/write-off, remaining balance (auto).

**Log Denial/Rejection:** claim ref, type (rejection = clearinghouse / denial = payer), reason code (CARC/RARC), narrative, $ amount, date, next action (appeal / correct-resubmit / write-off), assignee.

**New/Update Authorization:** member ID, payer, level of care, auth number, CON/RON type, units/days authorized, start date, end date, units used (auto from linked claims), status. Auto-compute remaining + expiration countdown.

---

## 7. Data model (core entities)

- **member** (id, external_id, dob[masked], active)
- **payer** (id, name, type: medicaid|commercial|selfpay, plan)
- **service_code** (code, system: CPT|HCPCS, description, default_charge)
- **claim** (id, member_id, payer_id, loc, dos_start, dos_end, provider, status, charge_total, auth_id?)
- **claim_line** (claim_id, service_code, units, charge)
- **payment** (id, claim_id, payer_id, paid_amount, patient_paid, adjustment, date)
- **denial** (id, claim_id, type: rejection|denial, reason_code, amount, status, next_action, assignee, date)
- **authorization** (id, member_id, payer_id, loc, auth_number, con_ron, units_authorized, units_used, start, end, status)
- **census_event** (member_id, loc, date_in, date_out)
- **audit_log** (actor, action, entity, before/after, timestamp)

---

## 8. Metric definitions (formulas — use these exactly)

- **Net Collection Rate** = Payments ÷ (Charges − Contractual Adjustments) × 100
- **Gross Collection Rate** = Payments ÷ Charges × 100
- **Denial Rate** = Denied claims ÷ Total adjudicated claims × 100
- **Rejection Rate** = Rejected claims ÷ Total submitted claims × 100
- **Clean Claim Rate** = Claims accepted first pass with no edits ÷ Total submitted × 100
- **Days in A/R** = Total A/R ÷ (Total charges ÷ days in period)
- **First-Pass Rate** = Claims paid on first submission ÷ Total submitted × 100
- **Claims-Built-vs-Census** = Billed claims ÷ Census-days eligible to bill (gap = leakage)
- **Auth Utilization** = Units used ÷ Units authorized × 100
- **A/R aging buckets**: 0–30 / 31–60 / 61–90 / 90+ days

---

## 9. Build order (phased)

1. **Shell + auth + roles** — sidebar, top bar, global date/payer/LOC filters, Entra SSO, role routing.
2. **Settings** — payers, codes, LOC, users (so data has somewhere to live).
3. **Team Ops + manual entry forms** — create the data.
4. **Client Billing Dashboard** — visualize it.
5. **UR / Authorizations dashboard** — the differentiator.
6. **Import Wizard** — CSV/835/837 ingestion.
7. **Connections & Automations** — API keys, webhooks, n8n.
8. **Admin control panel + audit log**.
9. **Export/report generation** (PDF/CSV).

---

## 10. Design notes to Claude Design

- Reuse the **existing Cholla design system** in this workspace for all tokens and components — do not invent a new brand.
- Every data screen ends each visual with a **bold one-line insight** (the "what this means" line).
- Prefer **charts over raw tables**; tables are for work queues, not for telling the story.
- Medicaid-aware UI: when payer type = Medicaid, **auto-collapse patient-responsibility panels**.
- Make **auth expiration** visually loud — it's the highest-leverage save in the whole product.
- Keep it fast, calm, and clinical. This is a tool people use all day, not a pitch deck.
