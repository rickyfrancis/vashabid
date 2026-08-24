# Vashabid

Next.js 16 app with [Payload CMS 3](https://payloadcms.com) and PostgreSQL.

## Prerequisites

- Dev container: Docker and a Dev Container-compatible client such as VS Code or GitHub Codespaces
- Host development: Node.js 24 LTS, pnpm 11, and Docker

## Dev container (recommended)

1. Open the repository in a Dev Container-compatible client. In VS Code, run **Dev Containers: Reopen in Container**.

2. Wait for the PostgreSQL health check and the automatic `pnpm install --frozen-lockfile` setup to finish.

3. Start the development server manually from the container terminal:

```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) for the frontend or [http://localhost:3000/admin](http://localhost:3000/admin) for Payload Admin.

The container pins Node.js 24, uses the repository's pinned pnpm version, keeps pnpm's package store in a persistent Docker volume, and forwards port 3000. Its Compose project and PostgreSQL volume are isolated from the host-development Compose project. It does not start the app automatically, so stopping or restarting the development server remains explicit.

The devcontainer injects development-only values for `DATABASE_URL`, `PAYLOAD_SECRET`, and `DATABASE_PUSH`; no `.env.local` is required inside it. The database hostname is `postgres` on the Compose network, and its port is not published to the host. To replace the disposable default secret, set `VASHABID_DEVCONTAINER_PAYLOAD_SECRET` in the environment that launches the Dev Container and rebuild it. The namespaced override prevents an unrelated host `PAYLOAD_SECRET` from being imported accidentally.

After changing the devcontainer configuration, Node version, or dependency setup, run **Dev Containers: Rebuild Container**.

## Host development

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

| Variable | Host development | Dev container | Staging / production |
|----------|------------------|---------------|----------------------|
| `DATABASE_URL` | `postgresql://payload:payload@localhost:5432/vashabid_dev` | `postgresql://payload:payload@postgres:5432/vashabid_dev` | VPS Postgres connection string (deploy secrets only) |
| `PAYLOAD_SECRET` | Random string (`openssl rand -base64 32`) | Disposable development-only default; override from the launch environment | Same, stored in deploy secrets |
| `DATABASE_PUSH` | `true` (default) | `true` | `false` — required on any shared/persistent database |

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
pnpm seed                 # Idempotently upsert deterministic development data
```

## Testing

```bash
pnpm test          # Run unit tests
pnpm test:watch    # Run unit tests in watch mode
pnpm test:e2e      # Run E2E tests; Playwright starts the app automatically
pnpm run ci        # Full CI pipeline: lint → test → build → e2e
```

### E2E prerequisites

```bash
pnpm exec playwright install --with-deps chromium
docker compose up -d   # Start local PostgreSQL
```

Playwright starts `pnpm dev` for local runs and `pnpm start` when `CI=true`.
To test an app that is already running, set its origin explicitly:

```bash
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000 pnpm test:e2e
```

Use `pnpm run ci` because `pnpm ci` is pnpm's built-in frozen-install command.
The package script is the verification pipeline used by GitHub Actions. Production
deployment remains a separate workflow: apply migrations with `pnpm migrate`,
then build with `pnpm build`.

## Deployment

### Coolify + VPS (recommended)

Postgres and app on the same VPS — use private networking, no need to expose Postgres publicly.

**Build command:**

```bash
pnpm install && pnpm migrate && pnpm build
```

**Start command:**

```bash
pnpm start
```

**Deploy secrets:** `DATABASE_URL`, `PAYLOAD_SECRET`, `DATABASE_PUSH=false`

### Vercel

Add `pnpm migrate && pnpm build` as the build command. Ensure Vercel can reach your VPS Postgres (IP allowlist). Set the same deploy secrets.

Run migrations before the build so the production database schema is current. Keep migration files small.

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
.devcontainer/           # Reproducible Node + Postgres development environment
```

## Learn more

- [Payload docs](https://payloadcms.com/docs)
- [Postgres adapter](https://payloadcms.com/docs/database/postgres)
- [Migrations](https://payloadcms.com/docs/database/migrations)
