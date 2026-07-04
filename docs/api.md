# API

REST route handlers under `src/app/api`. All require a session; every response is role-scoped
server-side; the `metrics/*` endpoints are de-identified and safe for `client_viewer`.

## Auth
- `POST /api/auth/login` — `{ role?, email? }` → issues signed-cookie session. `role` honored only
  when `NEXT_PUBLIC_DEMO_ROLE_SWITCH !== "false"` (demo preview); otherwise defaults to a real login.
- `POST /api/auth/logout` — clears the session.
- `GET /api/me` — current identity `{ userId, name, email, role, permissions[] }`.

## Metrics (de-identified aggregates)
- `GET /api/metrics/billing` — Billing Overview shape (KPIs, monthly, denialTrend, denialReasons,
  payerMix, serviceRevenue, patientSplit, censusVsClaims, counts). Matches `reference/cholla-data.js`.
- `GET /api/metrics/ur` — UR shape (ur KPIs, censusByLOC, authUtil, reauthRunway, losByLOC).

## Role-gated data
- `GET /api/ops` — work-queue rows (claims/denials/rejections/payments/auths) from Postgres.
  403 for `client_viewer`/`operations`.
- `GET /api/settings` — payers, service codes, providers. 403 below `junior_biller`.
- `GET /api/connections` — integration cards. `operations`/`manager`/`admin`.
- `GET /api/admin` — health, audit feed. `operations`(read)/`manager`(read)/`admin`.

## Roadmap (buildspec 08 + 11)
Claims/denials/payments/authorizations **mutations** with idempotency + audit; imports commit
(manager+); eligibility (270/271), auth-request (278), claim-status (276/277); EDI 837/835 batch +
ERA auto-post; reports queue; webhook receivers. Contracts are typed and land per milestone.

## Cross-cutting
- RBAC middleware (`src/lib/rbac.ts`) → 403 with a machine-readable reason.
- Zod validation on inputs. Mutations write `audit_log`.
- Client-role tokens are blocked from member-level endpoints at the router (defense in depth).
