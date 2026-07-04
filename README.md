# Cholla Behavioral Health — Billing & UR Intelligence Platform

A production-ready, backend-wired **Behavioral Health Billing & Utilization Review** platform for
Cholla Behavioral Health, rebuilt in Next.js + TypeScript + Postgres from the approved Cholla
design prototype. Pixel-faithful to the design, seeded from a real 6-month synthetic dataset, with
**server-enforced role-based access control** and a genuine API + database underneath.

> Synthetic data only — no real PHI, ever. Jan 1 – Jun 30 2026 simulated book of business.

---

## What's here (three surfaces, five roles)

- **Client Portal** — de-identified billing-health dashboards (KPIs, trends, payer mix, denial
  drivers, collections, UR/authorizations). No member-level PHI reaches the client role.
- **Leadership / Operations** — org-wide roll-ups, the Utilization Review dashboard, connections
  health, automated reports.
- **Billing Workspace** — the team's cockpit: Team Ops work queues (claims / denials / rejections /
  payments / authorizations), Import Wizard, Connections, Settings, Admin. Shared by a **Billing
  Manager** (full control) and a **Junior Biller** (scoped — capped write-offs, no settings/users,
  no deletes).

Roles: `client_viewer` · `operations` · `junior_biller` · `billing_manager` · `admin`
(see [`docs/rbac.md`](docs/rbac.md)).

The **Operations Layer** (VOB/eligibility, prior-auth submission, concurrent review, appeals, claim
scrubbing, EDI/ERA automation, credentialing, charge capture, alerts/tasks) is specified in
[`project/cholla-billing-buildspec/11_ADDITION_BILLING_UR_OPS_LAYER.md`](project/cholla-billing-buildspec/11_ADDITION_BILLING_UR_OPS_LAYER.md)
and scaffolded into the nav + schema; see the [build plan](docs/DECISIONS.md) for milestone status.

## Stack

| Layer | Choice |
|-------|--------|
| Web + API | **Next.js 15** (App Router), React 19, TypeScript |
| Database | **PostgreSQL** via **Prisma** |
| Auth | Signed-cookie session + demo role-preview; OIDC/Entra swaps in behind `getSession()` |
| RBAC | One policy module ([`src/lib/rbac.ts`](src/lib/rbac.ts)) enforced server-side on every API route |
| Charts | Inline SVG in the Cholla palette (ported from the prototype — no chart deps) |
| Deploy | **Vercel-ready** (Postgres via `DATABASE_URL`; `prisma generate` runs on build) |

## Quick start (local)

```bash
# 1. Postgres — either docker or a local cluster
docker compose up -d db                 # brings up postgres:16 on :5432

# 2. Configure env
cp .env.example .env                    # defaults match docker-compose

# 3. Install, create schema, seed the 6-month dataset
npm install
npm run db:push                         # schema -> database
npm run db:seed                         # loads ./project/cholla-billing-buildspec/dataset

# 4. Run
npm run dev                             # http://localhost:3000
```

Sign in with the demo **"preview as role"** chips (Client / Operations / Junior / Billing / Admin),
the Microsoft SSO button, or any email — all land you in the app as the selected role.

Verify the numbers reproduce the validated dataset:

```bash
npm test        # golden-file test: live Postgres aggregates == the validated KPIs
```

## Deploy to Vercel

1. Import this repo into Vercel (framework auto-detected as Next.js).
2. Provision Postgres (Vercel Postgres / Neon / Supabase).
3. Set env vars (Project → Settings → Environment Variables):
   - `DATABASE_URL` — **pooled** connection string
   - `DIRECT_URL` — direct connection (for `prisma db push` / seed)
   - `SESSION_SECRET` — `openssl rand -base64 32`
   - `NEXT_PUBLIC_DEMO_ROLE_SWITCH` — `true` to keep the demo role chips, `false` for prod SSO-only
4. Deploy. The build runs `prisma generate && next build`.
5. One-time seed against the prod DB: `DATABASE_URL=... DIRECT_URL=... npm run db:push && npm run db:seed`.

See [`docs/runbook.md`](docs/runbook.md) for details.

## Documentation

| Doc | What |
|-----|------|
| [`docs/architecture.md`](docs/architecture.md) | System shape, layers, backend-ready seams |
| [`docs/rbac.md`](docs/rbac.md) | Roles, surface access, action matrix |
| [`docs/domain-notes.md`](docs/domain-notes.md) | AHCCCS billing domain + KPI formulas |
| [`docs/api.md`](docs/api.md) | Endpoint surface |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Deviations from spec + milestone status |
| [`docs/runbook.md`](docs/runbook.md) | Setup, seed, test, deploy |
| [`docs/fable5-notes.md`](docs/fable5-notes.md) | Note on "Fable 5" (it's a model, not a UI library) |

## Design source & spec

The original approved design and the full build specification live under
[`project/`](project/) — the `.dc.html` prototype, `cholla-data.js` (validated aggregates), the
`cholla-billing-buildspec/` (11 numbered spec files), and the synthetic `dataset/`. These are the
authoritative visual + data references; the app is built to match them.
