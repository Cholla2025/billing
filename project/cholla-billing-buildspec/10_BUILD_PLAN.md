# 10 · Build Plan & Definition of Done

Work in milestones. After each, run its acceptance checks, commit, and post a short summary
(done / next / any deviations in `/docs/DECISIONS.md`).

## Milestone 0 — Research & scaffolding
- `/docs/fable5-notes.md` (how you'll use Fable 5 per surface) + `/docs/domain-notes.md`
  (AHCCCS billing, LOC, PA/UM, CARC, 837/835, KPI formulas).
- Monorepo scaffold (02), design tokens (06) in `/packages/config`, RBAC policy stub (04),
  shared types (03), `docker compose` boots empty app + db.
- **Accept**: `npm run dev` (or compose up) serves a blank shell with the real sidebar/topbar
  chrome and the login screen, no console errors.

## Milestone 1 — Data + domain + seed
- Schema/migrations (03). Seed loader ingests `./dataset` (09). `/packages/domain` computes all
  KPIs with unit tests against the golden values (09).
- **Accept**: DB seeded; domain tests green; a `/metrics/billing` + `/metrics/ur` stub returns
  the exact `reference/cholla-data.js` shape and numbers.

## Milestone 2 — Auth + RBAC
- OIDC (mock IdP locally) + email/password + MFA. Roles + server-side RBAC (04). `/me`. Dev
  "preview as role" behind a flag.
- **Accept**: each role logs in and lands on the right surface; RBAC contract tests pass
  (allow/deny per 04); a client_viewer token is blocked from member-level endpoints.

## Milestone 3 — Client Portal (Surface A)
- Billing Overview pixel-matched, bound to `/metrics/billing`; Reports (export/scheduled list).
- **Accept**: side-by-side with `reference/…standalone.html` matches; all 8 KPIs + charts render
  the golden numbers; no member data reaches the client surface.

## Milestone 4 — Leadership / Operations (Surface B)
- Ops roll-up, full UR/Authorizations dashboard, connections health (read), report scheduling.
- **Accept**: UR shows 84 active auths + the "17 expiring ≤5 days" red alert; reauth runway,
  census, utilization, LOS, and the auth-vs-claim explainer all render from the API.

## Milestone 5 — Billing Workspace (Surface C)
- Team Ops queues (Claims/Denials/Rejections/Payments/Auths) with real counts + working actions;
  entry tools (New Claim, Post Payment, Log Denial, New/Update Auth); Import Wizard (validate +
  commit); Connections & Automations; Settings; Admin (health, data-quality, audit).
- **Accept**: badge counts = 18,841 / 1,763 / 727 / 13,125 / 84; a **junior_biller** and a
  **billing_manager** see different capabilities exactly per 04 (write-off cap, commit-import,
  settings, users, bulk actions); every mutation appears in the audit log.

## Milestone 6 — Integrations & automation
- EMR + clearinghouse + webhook **simulators** and adapter interfaces (07); scheduled jobs (EMR
  pull, clearinghouse poll, reauth watcher, report delivery, data-quality sweep); webhook
  receiver with retry.
- **Accept**: a simulated 835 ingests → payments post → KPIs/A/R update; a simulated
  `auth.updated` moves an auth toward expiry and raises the alert; Connections shows live sync
  status + a failed webhook you can retry.

## Milestone 7 — Hardening & handoff
- e2e tests (login-by-role → key flows), a11y pass (WCAG-AA, reduced-motion), rate limiting,
  idempotency on financial POSTs, secrets in vault, deploy notes for a BAA host.
- `/docs`: architecture.md, api.md, rbac.md, runbook (setup/seed/test/deploy), and the
  "swap-to-real" checklists (02/07).
- **Accept**: full acceptance checklist below passes.

---

## Definition of Done (final acceptance)
1. `docker compose up` (or `npm install && npm run dev`) brings up web + api + db + worker,
   **seeded**, at the login screen, **no console errors**.
2. All five roles authenticate; each lands on the correct surface; RBAC enforced server-side.
3. **Client Portal** = de-identified aggregates, pixel-match, golden KPIs.
4. **Operations** = roll-ups + full UR dashboard + automated report delivery.
5. **Billing Workspace** = working queues + entry tools + imports + settings + admin, with
   **Billing Manager vs. Junior Biller** permission differences per 04.
6. Golden KPIs reproduce exactly (09); domain + RBAC + ingestion tests green.
7. EMR/clearinghouse/webhook **simulators** work and are swappable for real feeds via adapters.
8. Audit log captures every create/update/delete/export.
9. Visually matches `reference/Cholla Billing Platform.standalone.html` on every screen.
10. `/docs` complete, including a runbook and the swap-to-real checklist.

## Guardrails
- Do **not** redesign — match the prototype. Deviations go in `/docs/DECISIONS.md` with a reason.
- Synthetic data only; build as if it were PHI (encryption, least-privilege, audit,
  de-identified client surface).
- Use **Fable 5** components throughout (research first); note any place it doesn't fit.
- Keep every number traceable to `./dataset` + `/packages/domain`.
