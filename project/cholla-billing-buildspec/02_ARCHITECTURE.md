# 02 · Architecture

## Goals
- **Backend-ready and real**: a genuine DB + API + auth, not a mock. External-only systems (SSO
  IdP, live clearinghouse, EMR) are behind adapters with a documented "swap to real" seam.
- **Pixel-faithful** to the prototype in `reference/`.
- **RBAC enforced server-side.**
- **Auditable**: every mutation logged.
- **HIPAA-minded**: even though data is synthetic, build as if it were PHI (encryption in
  transit, least-privilege, audit, de-identified client surface, BAA-ready hosting notes).

## Recommended stack (default — deviate only with a stated reason)
- **Frontend**: React + TypeScript + Vite (or Next.js App Router if SSR/report rendering is
  wanted). **Fable 5** for the component layer (research + use fully — see the kickoff prompt).
  Charts: keep the prototype's inline-SVG approach OR a lightweight lib (visx/Recharts) that can
  reproduce them exactly. Routing: React Router (or Next routes). Data fetching: TanStack Query.
- **Backend**: Node + TypeScript. Either
  - **Option 1 (fastest to "real backend")**: Supabase (Postgres + Auth + RLS + storage +
    edge functions). RLS is a natural fit for RBAC + row scoping.
  - **Option 2**: NestJS (or Fastify) + Prisma + Postgres, JWT/OIDC auth, for a more classic
    service you fully control.
  Pick one; document the choice in /docs/architecture.md.
- **DB**: PostgreSQL. Prisma or SQL migrations checked in.
- **Auth**: OIDC/SSO (Microsoft Entra) with email/password fallback + MFA. In local dev, a
  mock IdP that issues the same claims; document the swap.
- **Jobs/automation**: a queue/scheduler (e.g. pg-boss, BullMQ, or Supabase cron) for EMR pulls,
  report delivery, and webhook processing.
- **Infra**: `docker compose` for local (web + api + postgres + worker). One command to boot
  seeded. Deploy notes for a BAA-capable host.

## Monorepo layout (suggested)
```
/apps
  /web            # React/Next front-end (Fable 5 components)
  /api            # backend service (or /supabase if Option 1)
  /worker         # scheduled jobs + webhook consumers (ingestion, reports)
/packages
  /ui             # shared components composed from Fable 5 + design tokens
  /types          # shared TS types (entities, API contracts)
  /domain         # billing/UR calculations (KPIs, aging, collection rate) — unit-tested
  /config         # design tokens, RBAC policy, feature flags
/db
  /migrations
  /seed           # loads ./dataset synthetic CSVs -> tables
/integrations
  /emr            # EMR adapter interface + local simulator (Kipu-shaped)
  /clearinghouse  # 837/835 + rejection adapter + simulator (Waystar-shaped)
  /automation     # n8n/Make-style webhook receivers + schedulers
/docs
/dataset          # (provided) synthetic source data
```

## Environments
- **local**: docker compose, seeded, mock IdP + simulated EMR/clearinghouse.
- **staging**: real IdP (test tenant), simulators still on, real DB.
- **prod**: real IdP, real EMR/clearinghouse adapters, BAA in place. Feature-flag the swap.

## Cross-cutting concerns
- **Config-driven RBAC**: a single policy module (`/packages/config/rbac`) consumed by both API
  (enforcement) and web (conditional UI). See 04.
- **The domain package is the source of truth for every number.** KPIs are computed there and
  unit-tested against the values in 09. The prototype's `reference/cholla-data.js` shows the
  exact output shape the dashboards expect — either serve that shape from the API, or adapt the
  front-end to the API and keep values identical.
- **Audit**: a middleware/trigger that writes an append-only `audit_log` row on every mutation.
- **De-identification**: the Client Portal must never receive member-level fields — enforce at
  the API/RLS layer, not just the UI.
- **Testing**: unit (domain/KPIs, RBAC), integration (API + DB), e2e (login-by-role → key flows),
  and a visual check against the standalone reference.

## "Backend-ready" seam checklist
- [ ] EMR adapter interface + local simulator; real Kipu implementation is a drop-in.
- [ ] Clearinghouse adapter (submit 837 / ingest 835 / ingest rejections) + simulator.
- [ ] IdP behind an auth provider interface; mock issues identical role claims.
- [ ] All dashboard data comes from the API (no hard-coded numbers in components).
- [ ] Report generation (PDF/CSV) server-side, queued, delivered on a schedule.
