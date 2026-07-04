# 08 · Backend API

REST (or tRPC/GraphQL if you prefer — keep contracts typed and shared in `/packages/types`).
All endpoints require auth; every response is **role-scoped server-side**. Mutations write
`audit_log`. Money in integer cents internally; format in the UI.

## Auth
- `POST /auth/sso/callback` — OIDC (Entra) callback → session/JWT with role claim.
- `POST /auth/login` — email/password fallback → MFA challenge.
- `POST /auth/mfa` — verify 6-digit → session.
- `POST /auth/logout`
- `GET  /me` — current user {id, name, email, role, permissions}.
- Dev-only: `POST /auth/preview-role` behind a flag (drives the demo "preview as role").

## Metrics / dashboards (aggregates; support ?from&to&payer&loc)
- `GET /metrics/billing` → the Billing Overview shape (KPIs, monthly, denialTrend,
  denialReasons, payerMix, serviceRevenue, patientSplit, censusVsClaims). **De-identified** —
  safe for client_viewer.
- `GET /metrics/ur` → UR KPIs, censusByLOC, authUtil, reauthRunway, losByLOC.
- `GET /metrics/rollup` → operations org-wide roll-up.
> The response shape should match `reference/cholla-data.js` (`window.CHOLLA_DATA`) so the
> front-end binds unchanged. Keep the exact numbers in 09.

## Claims
- `GET /claims` (filters: status, payer, loc, q, date, page)
- `GET /claims/:id`
- `POST /claims` (Draft) · `PATCH /claims/:id` (edit, submit) · `POST /claims/:id/submit`
- `GET /claims/:id/lines` · `POST /claims/:id/lines`

## Denials & rejections
- `GET /denials` (filter type=Denial|Rejection, status, payer, assignee)
- `PATCH /denials/:id` — set next_action, assignee, status
- `POST /denials/:id/appeal` · `POST /denials/:id/resubmit` ·
  `POST /denials/:id/write-off` (enforce write-off cap for junior_biller → 403 or "needs
  approval" if over threshold)
- `POST /denials` — log a denial/rejection manually

## Payments
- `GET /payments` · `POST /payments` (post) · `POST /payments/:id/reverse` (manager+)

## Authorizations
- `GET /authorizations` (filters: status, loc, payer, expiring<=N)
- `POST /authorizations` · `PATCH /authorizations/:id` (units_used, dates, status)
- `GET /authorizations/expiring?days=5` — feeds the sidebar badge + UR alert

## Imports
- `POST /imports` (multipart: file, source, mapping_profile) → validation summary
- `GET /imports/:id` (rows, warnings, errors)
- `POST /imports/:id/commit` (manager+; junior gets 403) → creates claims/payments/etc.

## Settings (manager/admin write; others read)
- `GET/PATCH /settings/payers` · `/settings/service-codes` · `/settings/providers`
- `GET/PATCH /settings/levels-of-care` · `/settings/carc-codes`
- `GET/PATCH /settings/thresholds` (write-off cap, etc.)

## Users & roles (manager/admin)
- `GET /users` · `POST /users` · `PATCH /users/:id` (role, active) · `DELETE /users/:id` (soft)

## Connections & automations (manager/admin)
- `GET /connections` · `PATCH /connections/:id` (toggle enabled) · `POST /connections/:id/sync`
- `GET /api-keys` · `POST /api-keys` · `POST /api-keys/:id/revoke`
- `GET /webhooks/events` · `POST /webhooks/events/:id/retry`
- `POST /webhooks/inbound/:source` — signed receiver (07)

## Reports (operations/manager/admin)
- `POST /reports/generate` (kind, range, format) → queued job → file URL
- `GET /reports` · `GET /report-jobs` (schedule + delivery status)
- `POST /report-schedules` · `PATCH /report-schedules/:id`

## Admin
- `GET /admin/health` (ingestion status, queue depth, error rows)
- `GET /admin/data-quality` (unmapped codes, unmatched payments, claims missing auth link)
- `GET /audit` (append-only feed; filter by actor/entity/date; exportable)

## Cross-cutting
- **RBAC middleware** reads the policy module (04) → 403 on violation, with a machine-readable
  reason. Never rely on the UI alone.
- **Pagination** on all list endpoints; **filtering** consistent (`from,to,payer,loc,status,q`).
- **Validation** with a schema lib (zod) on every input; typed errors.
- **Rate limiting** + audit on auth + mutations.
- **De-identification guard**: client_viewer/Client-Portal tokens are blocked from any
  member-level endpoint at the router level (defense in depth with RLS).
- **Idempotency** keys on POSTs that create financial records (payments, imports).

## Contract tests
- RBAC: each role hits each endpoint → expect allow/deny per 04.
- KPI: `/metrics/*` outputs equal the values in 09 (golden-file test).
- Ingestion: simulator → adapter → DB → recomputed KPIs unchanged.
