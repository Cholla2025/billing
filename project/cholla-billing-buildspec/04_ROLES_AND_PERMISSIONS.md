# 04 · Roles & Permissions (RBAC)

Enforce **server-side** (API/RLS). The UI also hides/disables what a role can't do, but the
server is the source of truth. Put the policy in one config module consumed by both.

## Roles
| Role | Surface(s) | One-line summary |
|------|-----------|------------------|
| `client_viewer` | Client Portal only | Read-only, **de-identified** billing health. No member names, no queues. |
| `operations` (Clinical Director) | Leadership/Operations (+ Client Portal view) | Org-wide roll-ups, UR dashboards, automated reports, connections health. Read + configure reports. |
| `billing_manager` | Billing Workspace (full) + Leadership | Full revenue-cycle control + settings + user management. |
| `junior_biller` | Billing Workspace (scoped) | Day-to-day queue work under the manager. No settings/users, capped write-offs, no deletes. |
| `admin` | Everything | Platform admin: users, connections, API keys, audit, data-quality. |

> The client specifically asked for a **Billing Manager** and a **Junior Billing** person with
> different permissions, plus the customer (client) surface and the automated leadership surface.
> That's exactly the five roles above (admin is the superset for setup/support).

## Surface access
| Surface | client_viewer | operations | junior_biller | billing_manager | admin |
|--------|:---:|:---:|:---:|:---:|:---:|
| Client Portal (de-identified) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Leadership / Operations (roll-ups, UR, reports) | — | ✅ | read | ✅ | ✅ |
| Billing Workspace (queues, entry, imports) | — | — | ✅ (scoped) | ✅ | ✅ |
| Settings (payers/codes/providers/LOC) | — | — | read | ✅ | ✅ |
| Users & Roles | — | — | — | ✅ | ✅ |
| Connections & API keys | — | read | — | ✅ | ✅ |
| Admin (health, data-quality, audit log) | — | read | — | read | ✅ |

## Action matrix (Billing Workspace)
| Action | junior_biller | billing_manager | admin |
|--------|:---:|:---:|:---:|
| View claims/denials/rejections/payments/auths | ✅ | ✅ | ✅ |
| Create/edit claim (Draft→Submit) | ✅ | ✅ | ✅ |
| Log denial / rejection | ✅ | ✅ | ✅ |
| Work a denial: correct & resubmit | ✅ | ✅ | ✅ |
| File appeal | ✅ | ✅ | ✅ |
| **Write-off** | ≤ $250, else request approval | ✅ any amount | ✅ |
| Post payment | ✅ | ✅ | ✅ |
| Reverse/void a payment | — (request) | ✅ | ✅ |
| Create / update authorization | ✅ | ✅ | ✅ |
| Add walk-in / new member record | ✅ | ✅ | ✅ |
| **Reassign queue items** to others | own only | ✅ all | ✅ |
| Bulk actions (mass resubmit/assign) | — | ✅ | ✅ |
| Run import (CSV/837/835) | ✅ upload+validate | ✅ + commit | ✅ |
| Commit import batch | — (needs manager) | ✅ | ✅ |
| Edit Settings (payers/codes/LOC) | — | ✅ | ✅ |
| Manage users / roles | — | ✅ | ✅ |
| Manage connections / API keys | — | ✅ | ✅ |
| Delete any record | — | soft-delete | ✅ |
| Export reports (PDF/CSV) | ✅ (scoped) | ✅ | ✅ |

Thresholds (write-off cap, etc.) are **config values**, not hard-coded — expose in Settings for
the manager/admin to change.

## Data scoping rules
- **client_viewer** and the **Client Portal**: API returns **aggregates only**, never
  member-level rows. Enforce with RLS/policy — a client token cannot query member/claim detail.
- **junior_biller**: sees all queue items but can only *reassign/act destructively* on their own
  unless the manager grants; write-offs capped; no settings/users.
- Every response is filtered by role at the API. The front-end must not be the only gate.

## Identity / avatars (match prototype copy)
- billing_manager → "Marcus Webb, Billing Team" (terracotta avatar)
- admin → "Ruth Okafor, Platform Admin" (navy avatar)
- Add: junior_biller → "Angela Ruiz, Junior Biller" (violet avatar);
  operations → "Ruth Okafor, Clinical Director"; client_viewer → "Dana Alvarez, Cholla Leadership".
- The prototype's "preview as role" switcher on login stays for demo, but real auth + role claims
  drive production. Keep both paths (demo switch behind a dev/feature flag).

## Audit
Every mutation writes `audit_log` (actor, action, entity, before/after, ts, ip). The Admin
surface renders this feed; it must be append-only and exportable.
