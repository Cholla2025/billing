# Roles & Permissions

Single source of truth: [`src/lib/rbac.ts`](../src/lib/rbac.ts). Enforced **server-side** on every
API route; the UI hides what a role can't do as defense-in-depth only.

## Roles

| Role | Surfaces | Summary |
|------|----------|---------|
| `client_viewer` | Client Portal only | Read-only, **de-identified** billing health. No member rows, no queues. |
| `operations` | Leadership/Ops (+ client view) | Org roll-ups, UR dashboards, connections health, reports. |
| `junior_biller` | Billing Workspace (scoped) | Day-to-day queue work. Write-offs capped, no settings/users, no deletes. |
| `billing_manager` | Billing Workspace (full) + Leadership | Full revenue-cycle control + settings + users + connections. |
| `admin` | Everything | Platform admin: users, connections, API keys, audit, data-quality. |

## Surface access (`SURFACE_ACCESS`)

| Surface | client | ops | junior | manager | admin |
|--------|:--:|:--:|:--:|:--:|:--:|
| Billing / UR dashboards (de-identified) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Concurrent Review, My Work | — | ✅ | ✅ | ✅ | ✅ |
| Team Ops, Eligibility, Charge Capture, Imports | — | — | ✅ | ✅ | ✅ |
| Connections | — | ✅ | — | ✅ | ✅ |
| Settings | — | — | read | ✅ | ✅ |
| Credentialing | — | — | — | ✅ | ✅ |
| Admin Home | — | read | — | read | ✅ |

## Action matrix (`can(role, permission)`)

Junior biller has day-to-day write access (create/submit claims, work denials, appeal, post
payments, manage auths, export) but **not**: write-off above the configurable cap
(`THRESHOLDS.juniorWriteOffCap = $250`), payment reversal, bulk actions, queue reassignment beyond
own, import commit, settings, users, connections, or deletes. Billing manager and admin have the
full set. See `PERMS` in `rbac.ts` for the exact map.

## De-identification guard

`client_viewer` is blocked at the router from any member-level endpoint (`/api/ops`,
`/api/settings`, `/api/admin`) and only receives `/api/metrics/*` aggregates — enforced in code,
verified by the RBAC checks in this repo. Member names never leave the server for the client role.

## Verified

- `client_viewer` → `/api/metrics/billing` 200, `/api/ops` 403, `/api/settings` 403.
- `junior_biller` → `/api/ops` 200, `/api/admin` 403.
- `billing_manager` → full permission set on `/api/me`.
