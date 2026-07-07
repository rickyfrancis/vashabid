# Vashabid

Next.js 16 app with [Payload CMS 3](https://payloadcms.com) and PostgreSQL.

## Prerequisites

- Node.js 20.9+
- pnpm
- Docker (for local Postgres)

## Local development

1. Start the local database:

```bash
docker compose up -d
```

2. Copy environment variables and set a secret:

```bash
cp .env.example .env.local
openssl rand -base64 32   # paste as PAYLOAD_SECRET
```

3. Run the dev server:

```bash
pnpm dev
```

4. Open [http://localhost:3000/admin](http://localhost:3000/admin) and create your first admin user.

The frontend lives at [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Local dev | Staging / production |
|----------|-----------|-------------------|
| `DATABASE_URL` | `postgresql://payload:payload@localhost:5432/vashabid_dev` | VPS Postgres connection string (deploy secrets only) |
| `PAYLOAD_SECRET` | Random string (`openssl rand -base64 32`) | Same, stored in deploy secrets |
| `DATABASE_PUSH` | `true` (default) | `false` — required on any shared/persistent database |

Never point local development at your VPS database while `DATABASE_PUSH=true`. Push auto-syncs schema changes and can alter or drop columns destructively.

## Database strategy

| Environment | Database | Schema updates |
|-------------|----------|----------------|
| Local dev | Docker Postgres (`docker compose up -d`) | Drizzle push (automatic in dev) |
| Staging | Separate DB on VPS | `pnpm migrate` only, `DATABASE_PUSH=false` |
| Production | VPS Postgres | `pnpm migrate` only, `DATABASE_PUSH=false` |

Reset local data anytime: `docker compose down -v && docker compose up -d`

## Migrations

### Phase 1 — Active development (now)

- Use local Docker Postgres with `DATABASE_PUSH=true`
- Change collections in `payload.config.ts` freely; schema syncs automatically
- Do **not** run `pnpm migrate` locally while using push

### Phase 2 — Schema stabilizing

When collections are ready for staging/production:

```bash
pnpm migrate:create    # generates SQL in migrations/
git add migrations/
git commit -m "Add initial Payload schema migration"
```

Set `DATABASE_PUSH=false` in staging/production deploy secrets, then run migrations against staging once to verify:

```bash
DATABASE_URL="your-staging-url" DATABASE_PUSH=false pnpm migrate
```

**Rule:** Push for local Docker only. Migrations for VPS databases. Never mix both on the same database.

### Phase 3 — Team data entry

- Content entry happens on the **deployed** admin panel (`/admin`), connected to VPS Postgres
- Developers continue using local Docker for schema work
- Every schema change: local push → `migrate:create` → PR → CI migrates staging → production

## Payload scripts

```bash
pnpm dev                  # Next.js dev server
pnpm payload              # Payload CLI
pnpm generate:types       # Regenerate payload-types.ts after schema changes
pnpm generate:importmap   # Regenerate admin import map
pnpm migrate:create       # Create migration from current schema
pnpm migrate              # Run pending migrations
pnpm ci                   # migrate + build (use in deploy pipelines)
```

## Deployment

### Coolify + VPS (recommended)

Postgres and app on the same VPS — use private networking, no need to expose Postgres publicly.

**Build command:**

```bash
pnpm install && pnpm ci
```

**Start command:**

```bash
pnpm start
```

**Deploy secrets:** `DATABASE_URL`, `PAYLOAD_SECRET`, `DATABASE_PUSH=false`

### Vercel

Add `pnpm ci` as the build command. Ensure Vercel can reach your VPS Postgres (IP allowlist). Set the same deploy secrets.

Serverless cold starts may run migrations via the `ci` script at build time — keep migration files small.

## VPS Postgres hardening

Before real data entry on an internet-accessible database:

- Require SSL: append `?sslmode=require` to `DATABASE_URL`
- Restrict Postgres to known IPs (Coolify server, team VPN, Vercel egress if applicable)
- Use a dedicated DB user with least privilege (not the `postgres` superuser)
- Enable daily backups (`pg_dump` or VPS snapshots) before running migrations

## Project structure

```
app/
├── (frontend)/          # Public site
└── (payload)/           # Payload admin + REST API
collections/             # Users, Media, …
payload.config.ts        # Payload configuration
migrations/              # SQL migrations (commit when schema stabilizes)
docker-compose.yml       # Local Postgres
```

## Learn more

- [Payload docs](https://payloadcms.com/docs)
- [Postgres adapter](https://payloadcms.com/docs/database/postgres)
- [Migrations](https://payloadcms.com/docs/database/migrations)
