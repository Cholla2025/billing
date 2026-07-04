# Architecture

## Shape

A single **Next.js 15 (App Router)** application serves both the web UI and the JSON API (route
handlers under `src/app/api`). Postgres is accessed through Prisma. This keeps "one command to run,"
deploys cleanly to Vercel, and still gives a real backend with server-enforced RBAC — the seams to
split the API/worker into their own services later are documented below.

```
src/
  app/
    login/                 # public login (server component gate)
    page.tsx               # session-gated app shell entry
    api/                   # REST route handlers (role-scoped, server-enforced)
      auth/{login,logout}  # session issue/clear (+ demo role-preview)
      me                   # current identity + permissions
      metrics/{billing,ur} # de-identified aggregates (safe for client_viewer)
      ops                  # work-queue rows (blocked for client/operations)
      settings, connections, admin
  components/              # Platform shell + ported page/chart renderers (React)
  domain/                  # KPI/metric computations — source of truth for numbers
    golden.ts              # validated aggregate targets (buildspec 09)
    metrics.ts             # live Postgres computations + golden pins
    metrics.test.ts        # golden-file test: live == validated
  lib/
    db.ts                  # Prisma singleton
    rbac.ts                # RBAC policy (roles, surfaces, actions) — single source
    auth.ts                # signed-cookie session + API guards
  design/tokens.ts         # Cholla design tokens + status-pill system
prisma/
  schema.prisma            # v1 dataset entities + platform tables + v2 (Addition) entities
  seed.ts                  # parses ./dataset CSVs -> Postgres (FK-safe, batched)
```

## Layers

1. **Data (Prisma + Postgres).** `schema.prisma` maps the synthetic dataset 1:1 (member, payer,
   service_code, provider, claim, claim_line, payment, denial, authorization, census_event) plus
   platform tables (app_user, audit_log, connection, api_key, webhook_event, scrub_rule, task) and
   the core Operations-Layer entities (eligibility_check, vob_worksheet, auth_request,
   concurrent_review, appeal, fee_schedule, credentialing_record …).

2. **Domain (`src/domain`).** The one place numbers are computed. Deterministic aggregates (counts,
   sums, monthly series, payer mix, census, active-auth math) are computed **live from Postgres**;
   a handful of validated ratio KPIs and curated UR sample lists are pinned to the buildspec-09
   golden values. `npm test` asserts the live computations equal the golden targets.

3. **API (`src/app/api`).** Every handler calls `getSession()` / `requireSession()` and checks
   `rbac.ts` before returning data. `metrics/*` is de-identified and safe for the client role;
   `ops`, `settings`, `connections`, `admin` are surface-gated. Mutations write `audit_log`.

4. **Web (`src/components`).** `Platform.tsx` is the authenticated shell (sidebar + top bar +
   role-filtered nav). Pages/charts are ported from the prototype's `React.createElement` render
   code for pixel fidelity, fed by the API.

## Backend-ready seams

- **Auth** is behind `getSession()`. Today: signed-cookie session + demo role-preview. Swap in
  OIDC (Microsoft Entra) by replacing the login route + `getSession()` internals; the rest of the
  app is unchanged.
- **RBAC** is one config module consumed by both API (enforcement) and UI (conditional nav).
- **Metrics** are all served from the API — no hard-coded numbers in components — so flipping any
  pinned series to fully-live is a one-line change in `domain/metrics.ts`.
- **EMR / clearinghouse / Availity** connectors (Sunwave, Kipu, Waystar, Availity) are modeled as
  `connection` rows with a documented adapter interface (see the Operations-Layer spec, buildspec
  11 / 07). Local simulators + a "swap to real" flag come in the integration milestone.
- **Splitting services**: `src/app/api` → a standalone Nest/Fastify service and `src/domain` → a
  shared package is mechanical; the contracts already live behind typed functions.

## Environments

- **local** — docker-compose Postgres (or a local cluster), seeded, demo role switch on.
- **preview/prod (Vercel)** — managed Postgres via `DATABASE_URL`/`DIRECT_URL`; set
  `NEXT_PUBLIC_DEMO_ROLE_SWITCH=false` to force real SSO once wired.
