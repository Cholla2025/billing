# 05 · Surfaces & Screens

The visual target is `reference/Cholla Billing Platform.standalone.html`. Open it and click
through every screen. Below is what to build, per surface. Tokens/components in 06.

## Global shell (all authenticated surfaces)
- **Collapsible sidebar** (navy `#21314F`), 246px ↔ 74px. Header = white chip with the logo +
  "BILLING & UR PLATFORM". Nav grouped (Dashboards / Operations / Platform), **filtered by role**
  (04). Active item = blue fill. The Utilization Review nav item shows a red badge = # auths
  expiring ≤5 days. Footer collapse toggle.
- **Top bar** (white, sticky): org switcher (logo + chevron), global **date-range** segmented
  control (Today/7d/30d/MTD/QTD/Custom), **Payer** select, **Level-of-care** select, Sign out,
  user identity (name + role + colored initials avatar).
- In production, the global filters must **actually re-slice** the data (the prototype's are
  display-only over precomputed aggregates). Selecting a Medicaid payer hides the
  Patient-Responsibility panel on Billing.

## Login / auth
- "Sign in with Microsoft" (Entra SSO) + email/password fallback + MFA (6-digit).
- Keep the demo "preview as role" switcher behind a dev flag. Real role comes from the IdP/DB.
- Route on sign-in by role (04): admin→Admin, operations→Operations roll-up, manager/junior→
  Billing Workspace (Team Ops), client_viewer→Client Portal.

---

## SURFACE A — Client Portal (customer site)
Read-only, de-identified. No queues, no member names.

**A1 · Billing Overview** — 8 KPI cards (Claims Billed, Total Charges, Total Collected, Net
Collection Rate, Denial Rate, Rejection Rate, Days in A/R, Clean Claim Rate) + chart cards, each
ending in a bold one-line **insight**:
- Claims volume over time (area line, monthly)
- Charges vs. Collected (grouped bars + collected line)
- Denials & rejections over time (stacked bars)
- Denial reasons (CARC donut, center total)
- Payer mix (collections donut, center = total collected)
- Revenue by service code (horizontal bars)
- Patient-responsibility split (donut) — hidden for Medicaid payer filter
- Claims Built vs. Census (leakage bars + unbilled-days callout)

**A2 · Reports** — board-ready exports (PDF/CSV), scheduled delivery list (read-only for client).

Client Portal never calls member-level endpoints. Aggregates only.

---

## SURFACE B — Leadership / Operations (automated)
**B1 · Operations Roll-up** — org-wide KPIs across all programs (active programs, total collected,
currently in-treatment census, overall attendance/utilization), trend tiles, and the automated
**report delivery** status (what got pulled from the EMR, when, and what was sent).

**B2 · Utilization Review / Authorizations** (the differentiator):
- 6 KPIs: Active Authorizations, Units/Days Remaining, **Auths Expiring ≤5 Days** (red),
  Auth Denial Rate, Avg LOS · IOP, Current Census.
- Pulsing red **alert banner** for expiring auths.
- Census by level of care (bars), Authorization utilization (per-auth progress; ≥90% red),
  **Reauth runway** (rows by days-to-expiration, ≤5 flagged), LOS by LOC (box-plots), and the
  **auth-denial vs. claim-denial** explainer (two stat blocks; different stages, different fixes).

**B3 · Connections health (read)** — status of EMR/clearinghouse/automation feeds (see 07).

Operations can configure report schedules; mostly read on billing internals.

---

## SURFACE C — Billing Workspace (billing team: manager + junior)
**C1 · Team Ops** —
- 3 automation sync tiles (clearinghouse, EMR, webhook) with status dots + last-sync + error
  counts.
- **Work-queue tabs** with live counts in the badges: Claims, Denials, Rejections, Payments,
  Authorizations. Each renders a data table with status pills (06). Rows reference members by
  internal ID (PHI-safe).
- Bulk actions (Assign / Mark worked / Resubmit / Export) — manager-only bulk (04).
- **Entry tools** (4 cards → forms): New Claim, Post Payment, Log Denial/Rejection,
  New/Update Auth. Junior vs. manager capabilities differ (04): e.g. junior can log but not
  commit an import, write-offs capped, etc.

**C2 · Import Wizard** — 5 steps (Upload → Map columns → Validate → Preview → Commit). Validation
summary (valid/warnings/errors) + error table. Junior can upload+validate; manager commits.

**C3 · Connections & Automations** — source cards with on/off toggles, sync status, record/error
counts; API keys (endpoint + copy/revoke); webhook delivery log + retry. Manager/admin only.

**C4 · Settings** — real dataset lists: **payers** (type + pay-days), **service codes**
(charge/allowed), **rendering providers** (role), **levels of care** (PA rules), **users & roles**,
and a **CARC/RARC** reference table. Also the config thresholds (write-off cap, etc.). Manager/
admin edit; junior read.

**C5 · Admin** — system-health KPIs, **data-quality flags** (unmapped codes, unmatched payments,
claims missing auth link), and the immutable **audit-log** feed. Admin edits; others read as
permitted.

## Interactions to preserve
- Sidebar nav swaps page content; Ops tabs switch queues; sidebar collapses; login routes by role.
- Charts are deterministic from data (inline SVG in the prototype: line, groupedBars, stacked,
  donut, vbars, hbars). Reproduce exactly.
- Subtle fade on auth cards; pulsing dot on the UR alert; nav hover state.
- Loading state while data resolves; empty states for queues/rosters.

## Screen → data → endpoint map (build this table out as you go)
| Screen | Reads | Writes |
|--------|-------|--------|
| A1 Billing Overview | GET /metrics/billing (aggregates) | — |
| B2 UR / Auth | GET /metrics/ur, /authorizations | PATCH /authorizations/:id |
| C1 Team Ops (Claims) | GET /claims?status=… | POST /claims, PATCH /claims/:id |
| C1 (Denials) | GET /denials | PATCH /denials/:id (appeal/resubmit/write-off) |
| C1 (Payments) | GET /payments | POST /payments |
| C2 Import | — | POST /imports, POST /imports/:id/commit |
| C4 Settings | GET /settings/* | PATCH /settings/* (manager+) |
| C5 Admin | GET /admin/health, /audit | — |
(Full API in 08.)
