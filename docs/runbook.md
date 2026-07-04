# Runbook

## Local setup
```bash
docker compose up -d db          # or run a local postgres:16 on :5432
cp .env.example .env
npm install                      # runs `prisma generate` (postinstall)
npm run db:push                  # apply schema
npm run db:seed                  # load ./project/cholla-billing-buildspec/dataset
npm run dev                      # http://localhost:3000
```
No Docker? Run Postgres directly (as a non-root user):
```bash
initdb -D .pgdata -U cholla --auth=trust
pg_ctl -D .pgdata -o "-p 5432" -l pg.log start
createdb -h 127.0.0.1 -U cholla cholla
```

## Test
```bash
npm test        # golden-file: live Postgres aggregates == validated KPIs (buildspec 09)
```

## Reseed
```bash
npm run db:reset   # force-reset schema + reseed
```
`DATASET_DIR` env overrides the CSV source directory.

## Deploy to Vercel
1. Import the repo (Next.js auto-detected). Build command is the default `npm run build`
   (= `prisma generate && next build`).
2. Provision Postgres (Vercel Postgres / Neon). Set env:
   - `DATABASE_URL` (pooled), `DIRECT_URL` (direct), `SESSION_SECRET`, `NEXT_PUBLIC_DEMO_ROLE_SWITCH`.
3. One-time seed against prod:
   ```bash
   DATABASE_URL=<direct> DIRECT_URL=<direct> npm run db:push && npm run db:seed
   ```
4. Redeploy. App boots at the login screen.

## Env vars
| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | Postgres connection (pooled on serverless) |
| `DIRECT_URL` | Direct connection for `prisma db push` / seed |
| `SESSION_SECRET` | HMAC key for the session cookie (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_DEMO_ROLE_SWITCH` | `true` keeps the demo role chips; `false` = SSO-only |

## Troubleshooting
- **Prisma "directUrl" validation error** — set `DIRECT_URL` (locally, same as `DATABASE_URL`).
- **Empty dashboards** — the DB isn't seeded; run `npm run db:seed`.
- **Auth loop** — `SESSION_SECRET` changed between requests; keep it stable.
