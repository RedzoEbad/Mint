# MINT International Platform

A comprehensive, role-based platform for managing overseas employment workflows, candidates, finances, and analytics.

## Quick Start

```bash
# 1) Install dependencies
npm install

# 2) Create env file
copy .env.example .env.local   # On Windows (PowerShell: cp .env.example .env.local)

# 3) Configure .env.local (see Environment Variables)

# 4) Start dev server
npm run dev

# (Optional) 5) Sync database schema via Drizzle
npm run db:sync:smart
```

- Dev server: `http://localhost:3000`
- API docs (Swagger UI): `http://localhost:3000/api/docs`
- OpenAPI JSON: `http://localhost:3000/api/openapi`

## Environment Variables

Set these in `.env.local`:

- DATABASE_URL: Postgres connection string
- NEXTAUTH_SECRET: Secret used by NextAuth (generate a strong value)
- NODE_ENV: development | production
- DB_POOL_MAX: Connection pool max (default 10)
- DB_POOL_MIN: Connection pool min (default 2)
- DB_IDLE_TIMEOUT_MS: Idle timeout ms (default 30000)
- DB_CONN_TIMEOUT_MS: Connection timeout ms (default 5000)
- DB_STATEMENT_TIMEOUT_MS: Statement timeout ms (default 20000)
- DB_QUERY_TIMEOUT_MS: Query timeout ms (default 20000)
- ADMIN_EMAIL: Seeded super admin email (default admin@mintinternational.org)
- ADMIN_PASSWORD: Seeded super admin password (default admin123)
- ADMIN_ROLE_EMAIL: Seeded admin role email (default admin_role@mintinternational.org)
- ADMIN_ROLE_PASSWORD: Seeded admin role password (default adminrole123)
- RECEPTIONIST_EMAIL: Seeded receptionist email
- RECEPTIONIST_PASSWORD: Seeded receptionist password
- AGENT_EMAIL: Seeded process agent email
- AGENT_PASSWORD: Seeded process agent password
- ACCOUNTS_EMAIL: Seeded accountant email
- ACCOUNTS_PASSWORD: Seeded accountant password

Notes:
- `lib/database.ts` uses `DATABASE_URL` and supports SSL in production.
- `lib/auth-config.ts` uses `NEXTAUTH_SECRET`. Sessions are JWT-based.

## Database (PostgreSQL + Drizzle)

- Schema: `drizzle/schema.ts` (enums, tables, FKs, indexes)
- Migrations folder: `drizzle/` (SQL files)
- Sync helper: `scripts/sync-schema.js` (generate + push)
- Migrate (Node migrator): `scripts/migrate-db.js`

Recommended flow:

```bash
# Ensure DATABASE_URL in .env.local

# Generate migrations from schema changes
node scripts/sync-schema.js generate

# Apply migrations to the database
node scripts/sync-schema.js push

# Or use drizzle migrator (single-connection)
node scripts/migrate-db.js
```

Seed initial users (super admin and demo roles):

```powershell
$env:DATABASE_URL = "postgres://USER:PASSWORD@HOST:PORT/DB"
$env:ADMIN_EMAIL = "admin@mintinternational.org"
$env:ADMIN_PASSWORD = "admin123"
node scripts/init-db.js
```

## Authentication & RBAC

- NextAuth credentials provider: `lib/auth-config.ts`
- Server helpers: `lib/nextauth.ts` (`getServerAuth`, `requireAuth`, `requireRole`)
- Password hashing: `bcryptjs`
- Session strategy: JWT, 24h max age
- Roles: `super_admin`, `admin`, `receptionist`, `process_agent`, `accountant` (see `drizzle/schema.ts`)
- Route/UI role policy: `lib/rbac.ts`

Sign in page: `/login` (configured in NextAuth pages). Unauthorized errors redirect to `/unauthorized`.

## API Overview

- OpenAPI route: `app/api/openapi/route.ts`
- Swagger UI: `app/api/docs/*` (served at `/api/docs`)
- Auth routes: `app/api/auth/[...nextauth]/route.ts`, `app/api/auth/login/*`, `logout/*`, `verify/*`
- Domain routes include: candidates, companies, engagements, payments, salaries, expenses, uploads, workflows, admin modules

Auth usage (JWT via credentials login route if applicable):

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mintinternational.org","password":"admin123"}'
```

Use the returned token (if provided by the login route) in subsequent requests:

```bash
authHeader="Authorization: Bearer YOUR_TOKEN"
curl -H "$authHeader" http://localhost:3000/api/candidates
```

In Swagger UI, use the Authorize button to set the token.

## Uploads

- Public folder: `public/uploads/*`
- Endpoint: `POST /api/uploads/{type}`
- Form field: `file` (multipart/form-data)
- Response: `{ success: true, url, filename }`
- Allowed roles: super_admin, admin, receptionist, process_agent, accountant

Example (PowerShell):

```powershell
$token = "YOUR_JWT"
Invoke-WebRequest -Uri http://localhost:3000/api/uploads/profile-images -Method POST -Headers @{
  Authorization = "Bearer $token"
} -InFile .\avatar.jpg -ContentType "multipart/form-data"
```

## Project Structure

```
app/                # App router, pages and API routes
components/         # UI and layout components
lib/                # Auth, DB, utils, RBAC
drizzle/            # Migrations, snapshots, relations
scripts/            # DB sync/migrate/init helpers
public/             # Static assets and uploads
```

Key files:
- `lib/database.ts`: Pooled Postgres connection with timeouts
- `lib/auth-config.ts`: NextAuth credentials setup
- `lib/nextauth.ts`: session and role guards
- `lib/rbac.ts`: role-to-route/feature mapping
- `drizzle/schema.ts`: enums and tables for users, candidates, workflows, payments, expenses, salaries, logs

## Dashboards & Roles

- Super Admin: Full access, exports, user/role management
- Admin: Employees roster, general oversight, limited exports
- Receptionist: Candidate intake (CRUD)
- Process Agent: Workflow stage operations, payment requests
- Accountant: Approve stage payments, manage salaries and expenses

## Scripts

- dev: `next dev`
- build: `next build`
- start: `next start`
- lint: `next lint`
- db:sync:smart: `node scripts/sync-schema.js` (generate + push)

Helpful direct invocations:
- `node scripts/init-db.js`
- `node scripts/migrate-db.js`
- `node scripts/sync-schema.js generate|push|studio|help`

## Tech Stack

- Next.js 15, React 19, TypeScript
- Drizzle ORM, PostgreSQL
- NextAuth (Credentials)
- Tailwind CSS, Radix UI/shadcn components
- Swagger UI for API docs

## Production Notes

- Enable SSL for Postgres (handled automatically when `NODE_ENV=production` in `lib/database.ts`)
- Set strong `NEXTAUTH_SECRET`
- Consider image optimization/CDN; `next.config.mjs` sets `images.unoptimized: true`
- Bundle analysis: set `ANALYZE=true` and run build

## License

© 2025 MINT International. All rights reserved.
