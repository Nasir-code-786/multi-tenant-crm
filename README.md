# Multi-Tenant CRM System

A minimal multi-tenant CRM built with **NestJS**, **PostgreSQL**, and **Next.js**. The system demonstrates tenant-isolated data access, concurrency-safe customer assignment, soft deletes, activity logging, and a focused frontend for day-to-day CRM workflows.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | NestJS 11, TypeScript, TypeORM |
| Database | PostgreSQL |
| Frontend | Next.js 14 (App Router), React Query, Zustand, Tailwind CSS |
| Auth | JWT (Bearer token) |
| API Docs | Swagger / OpenAPI |

## Project Structure

```
multi-tenant-crm/
├── server/          # NestJS API
│   └── src/
│       ├── auth/           # Login, JWT strategy
│       ├── users/          # User management (admin-only create)
│       ├── customers/      # Customer CRUD, search, assign, soft delete
│       ├── notes/          # Customer notes
│       ├── activity-log/   # Audit trail for customer events
│       ├── organizations/  # Organization entity (tenant root)
│       ├── common/         # Guards, decorators (roles, current user)
│       └── database/       # Seed scripts
└── client/          # Next.js frontend
    └── src/
        ├── app/            # Pages (login, customers, users)
        ├── components/     # Reusable UI + feature components
        ├── hooks/          # React Query hooks
        ├── lib/api/        # Typed Axios API clients
        └── store/          # Zustand UI state
```

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm

### 1. Database

Create a PostgreSQL database:

```sql
CREATE DATABASE crm;
```

### 2. Backend

```bash
cd server
npm install
```

Create `server/.env`:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=crm
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
PORT=3001
```

Seed the database:

```bash
npm run seed
```

Optional — load 100,000 customers for performance testing (run base seed first):

```bash
npm run seed:bulk
# or: BULK_COUNT=100000 npm run seed:bulk
```

Start the API:

```bash
npm run start:dev
```

API base URL: `http://localhost:3001/api`  
Swagger docs: `http://localhost:3001/api/docs`

### 3. Frontend

```bash
cd client
npm install
```

Create `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Start the client:

```bash
npm run dev
```

Open `http://localhost:3000`

### Seed Accounts

All seeded users share the password: **`password123`**

| Email | Role | Organization |
|-------|------|--------------|
| alice@techcorp.com | admin | TechCorp Inc |
| bob@techcorp.com | member | TechCorp Inc |
| carol@techcorp.com | member | TechCorp Inc |
| dave@startupxyz.com | admin | StartupXYZ |
| eve@startupxyz.com | member | StartupXYZ |
| frank@startupxyz.com | member | StartupXYZ |

Each organization starts with 10 customers (5 assigned per member, exercising the max-5 assignment cap) and 2 notes per customer.

---

## API Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/users` | JWT | List users in your org |
| POST | `/api/users` | JWT + admin | Create user |
| GET | `/api/customers` | JWT | List customers (paginated, searchable) |
| POST | `/api/customers` | JWT | Create customer |
| GET | `/api/customers/:id` | JWT | Get customer |
| PATCH | `/api/customers/:id` | JWT | Update customer |
| DELETE | `/api/customers/:id` | JWT | Soft delete customer |
| POST | `/api/customers/:id/restore` | JWT | Restore soft-deleted customer |
| POST | `/api/customers/:id/assign` | JWT | Assign customer to user |
| GET | `/api/customers/:id/activity` | JWT | Customer activity log |
| GET | `/api/customers/:id/notes` | JWT | List notes |
| POST | `/api/customers/:id/notes` | JWT | Add note |

---

## 1. Architecture Decisions

### Layered backend (NestJS modules)

Each domain (auth, users, customers, notes, activity-log) is a self-contained NestJS module with:

- **Controller** — HTTP routing, guards, DTO binding
- **Service** — business logic and database access
- **Entity** — TypeORM schema definition
- **DTO** — request validation via `class-validator`

This keeps responsibilities separated and makes each feature easy to locate and extend.

### JWT-based authentication

Users authenticate via `POST /api/auth/login`. The issued JWT embeds `sub` (user id), `email`, `role`, and `organizationId`. Every protected route uses `JwtAuthGuard`; the payload is exposed to handlers via the `@CurrentUser()` decorator.

### Application-level multi-tenancy

There is no shared schema or row-level security in PostgreSQL. Instead, **every query filters by `organizationId` from the authenticated user**. This is simple, explicit, and easy to audit in service code.

### Frontend state split

- **React Query** — server state (customers, notes, users), caching, and invalidation after mutations
- **Zustand** — lightweight UI state (modal open/close, selected customer id)
- **localStorage** — JWT token and current user profile

This avoids duplicating server data in a global store while keeping UI interactions responsive.

### Soft delete over hard delete

Customers use TypeORM's `@DeleteDateColumn`. Normal queries always include `deletedAt IS NULL`. Notes and activity logs are never deleted when a customer is soft-deleted, preserving history. A dedicated restore endpoint reverses the soft delete.

---

## 2. Multi-Tenancy Isolation

### How it works

1. On login, the JWT is signed with the user's `organizationId`.
2. `JwtStrategy.validate()` maps the token payload to a `CurrentUserPayload` object attached to every request.
3. All service methods receive this payload and **always** scope queries:

```typescript
// Example: every customer query includes org filter
.where('c.organizationId = :orgId', { orgId: user.organizationId })
.andWhere('c.deletedAt IS NULL')
```

4. Assignment validates that the target user belongs to the same organization before allowing the operation.
5. Notes and activity logs are scoped by `organizationId` in addition to `customerId`.

### What this guarantees

- A user in **TechCorp Inc** cannot list, read, update, delete, or assign customers belonging to **StartupXYZ**.
- Cross-tenant assignment is rejected because the target user lookup includes an `organizationId` filter.

### Limitations (intentional trade-offs)

- Isolation depends on **every new endpoint** correctly filtering by `organizationId`. A dedicated tenant guard or PostgreSQL RLS would add defense-in-depth but was not implemented to keep the assignment minimal.
- A revoked or moved user could still use a stale JWT until it expires.

---

## 3. Concurrency-Safe Assignment

### Requirement

Each user may have at most **5 active** (non-soft-deleted) customers assigned. Concurrent assignment requests must not allow a 6th customer to slip through.

### Implementation (`POST /api/customers/:id/assign`)

The assignment logic runs inside a **single database transaction**:

1. **Pessimistic write lock** on the target user row (`SELECT … FOR UPDATE`). This serializes all concurrent assignments targeting the same user.
2. Verify the customer exists in the caller's organization and is not soft-deleted.
3. Count active assignments for the target user (`assignedTo = userId AND deletedAt IS NULL AND organizationId = org`).
4. If the count is already 5 and the customer is not already assigned to that user, reject with `400 Bad Request`.
5. Update `assignedTo` and write an activity log entry — both in the same transaction.

### Why pessimistic locking on the user row?

Locking the user row is sufficient because all assignments to a given user must pass through that row. Concurrent requests block on the lock, then re-count inside the transaction. Locking individual customer rows is unnecessary for enforcing a per-user cap.

### Re-assignment edge case

If a customer is **already** assigned to the target user, the cap check is skipped (idempotent re-assign).

### Known gap

Setting `assignedTo` during **customer create or update** (`POST/PATCH /customers`) does not go through this transactional assign path. For production, create/update should either reject `assignedTo` or delegate to the same assign logic.

---

## 4. Performance Strategy & Indexing

### Target

Support **100,000+ customers per organization** with responsive list, search, and pagination.

### Entity-level indexes (TypeORM `@Index`)

| Index | Table | Columns | Purpose |
|-------|-------|---------|---------|
| `idx_users_org` | users | `organizationId` | Fast org-scoped user lookups |
| `idx_customers_org` | customers | `organizationId` | Tenant filter on every list query |
| `idx_customers_assigned` | customers | `assignedTo` | Assignment count queries |
| `idx_notes_customer` | notes | `customerId` | Notes per customer |
| `idx_activity_logs_entity` | activity_logs | `entityId`, `entityType` | Activity timeline per customer |

### Additional indexes (created by seed script)

| Index | Type | Purpose |
|-------|------|---------|
| `idx_customers_org_email_unique` | Partial unique `(organizationId, email) WHERE deletedAt IS NULL` | DB-level deduplication for concurrent creates; allows duplicate emails among soft-deleted rows |
| `idx_customers_search` | GIN full-text on `name \|\| email` | Prepared for FTS-based search (see trade-offs) |

### Query patterns

- **Pagination** — `skip/take` with `organizationId` filter and `ORDER BY createdAt DESC`.
- **Search** — `ILIKE` on `name` and `email` (simple, works with partial matches).
- **N+1 avoidance** — customer list uses `leftJoinAndSelect('c.assignee', 'assignee')` in a single query instead of per-row lookups.
- **Bulk insert** — `seed-bulk.ts` uses multi-row `INSERT` (5,000 rows per batch) instead of per-row `.save()`.

### Bulk seed & benchmark

```bash
npm run seed        # base data (2 orgs, 20 customers)
npm run seed:bulk   # +100,000 customers into TechCorp Inc
```

The bulk script runs benchmark queries (count, paginated fetch, deep offset, ILIKE search) to validate index usage.

### Future performance improvements

- Replace offset pagination with **keyset (cursor) pagination** for deep pages (offset 100k is slow).
- Switch search from `ILIKE '%term%'` to the existing GIN FTS index for large datasets.
- Add composite index `(organizationId, deletedAt, createdAt DESC)` for the primary list query.

---

## 5. How I Would Scale This System

### Short term (single deployment)

- Replace `synchronize: true` with **TypeORM migrations** for safe schema changes.
- Add **connection pooling** (PgBouncer) as concurrent users grow.
- Cap `limit` on pagination endpoints to prevent abuse.
- Add **rate limiting** (`@nestjs/throttler`) on auth and write endpoints.

### Medium term (more tenants & traffic)

- **Read replicas** for customer list and search queries; writes stay on primary.
- **Redis cache** for frequently accessed customer detail pages and user lists (short TTL, invalidate on mutation).
- **Background jobs** (BullMQ) for bulk imports, email notifications, and heavy report generation.
- Move activity log writes to an **async event bus** to decouple from request latency.

### Long term (many organizations)

- **Horizontal sharding** by `organizationId` if a single Postgres instance becomes a bottleneck.
- **Dedicated tenant guard middleware** that asserts `organizationId` on every request automatically.
- **PostgreSQL Row-Level Security** as a second layer of tenant isolation.
- Separate **search service** (Elasticsearch / Meilisearch) for full-text search at scale.
- **Observability** — structured logging, distributed tracing (OpenTelemetry), and metrics per tenant.

---

## 6. Trade-offs

| Decision | Chosen | Alternative | Why |
|----------|--------|-------------|-----|
| Tenant isolation | App-level `organizationId` filter | Postgres RLS | Simpler to implement and reason about in a minimal CRM; easier to demo in code review |
| Assignment concurrency | Pessimistic lock on user row | Optimistic locking with version column | Pessimistic lock is straightforward for a low-contention assign endpoint; avoids retry loops |
| Search | `ILIKE` | Full-text search (GIN index exists) | `ILIKE` is simpler and sufficient for demo scale; FTS index is ready for a future switch |
| Schema management | `synchronize: true` | Migrations | Faster local development; **not suitable for production** |
| Email uniqueness | Global unique on users; per-org unique on customers (partial index) | Per-org unique on users too | Global user email keeps login simple (one account = one email); customer emails are tenant-scoped |
| Activity logging | Synchronous insert after main operation | Async event queue | Simpler and guarantees log exists before response; acceptable for current scale |
| Frontend updates | Invalidate React Query cache on mutation | Optimistic updates | Correctness over perceived speed; avoids rollback complexity |
| Production feature | Swagger/OpenAPI docs | Rate limiting, caching, etc. | API documentation improves developer experience, onboarding, and manual testing — high value for a CRM API |

---

## 7. Production Improvement — Swagger / OpenAPI

### What was implemented

Interactive API documentation at **`/api/docs`** using `@nestjs/swagger`:

- Auto-generated OpenAPI spec from controllers and DTOs
- **Bearer auth** support — testers can paste a JWT and call endpoints from the browser
- `@ApiTags`, `@ApiBearerAuth`, and `@ApiProperty` decorators on DTOs for clear request/response schemas
- Global `ValidationPipe` (`whitelist`, `transform`, `forbidNonWhitelisted`) ensures documented schemas match enforced validation

### Why this choice

For a CRM API consumed by a frontend (and potentially third-party integrations), **discoverable, testable documentation** is a practical production concern:

- New developers can explore all endpoints without reading source code.
- QA and reviewers can exercise the API interactively during evaluation.
- The OpenAPI spec can later generate client SDKs or power contract tests.
- It pairs naturally with the existing DTO validation layer — docs stay in sync with enforced rules.

### What I would add next in production

- Rate limiting on `/auth/login`
- Structured request logging (correlation IDs)
- Health check endpoint (`/health`)
- Helmet security headers
- Environment-specific CORS allowlist (instead of `origin: true`)

---

## Frontend Features

| Feature | Implementation |
|---------|----------------|
| Customer list | Paginated table with search |
| Create / Edit | Modal form with validation |
| Assign customer | Dedicated assign modal with slot usage indicator (x/5) |
| Notes | Add and list notes on customer detail page |
| Activity timeline | Customer detail page shows audit log |
| Pagination | Previous / Next controls |
| Debounced search | 400ms debounce via `use-debounce` |
| Loading states | Spinners on page load and form submit |
| Error handling | Inline error messages from API responses |
| Reusable components | Modal, Pagination, SearchInput, Avatar, ErrorMessage, LoadingSpinner |
| State management | React Query (server) + Zustand (UI modals) |
| Type-safe API | Typed Axios clients + shared TypeScript interfaces |

---

## Soft Delete Integrity

| Concern | Behavior |
|---------|----------|
| Normal customer queries | Exclude rows where `deletedAt IS NOT NULL` |
| Notes on deleted customer | Remain in database, unchanged |
| Activity logs | Remain in database, unchanged |
| Restore | `POST /customers/:id/restore` clears `deletedAt`; customer reappears in lists; notes were never removed |

Before restore, the system re-checks email uniqueness within the organization to prevent conflicts with a newer customer using the same email.

---

## Scripts Reference

### Server (`server/`)

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start API in watch mode |
| `npm run build` | Compile for production |
| `npm run start:prod` | Run compiled `dist/main.js` |
| `npm run seed` | Seed base data |
| `npm run seed:bulk` | Insert 100k customers + run benchmarks |
| `npm run lint` | ESLint |
| `npm run test:e2e` | E2E tests |

### Client (`client/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |

---

## Deployment Notes

This repository is designed to run as two services:

1. **API** — deploy `server/` (e.g. Railway, Render, Fly.io) with PostgreSQL attached.
2. **Frontend** — deploy `client/` (e.g. Vercel) with `NEXT_PUBLIC_API_URL` pointing to the deployed API.

Ensure production environment variables are set (`JWT_SECRET`, database credentials, CORS origin). Disable `synchronize: true` and use migrations before any real deployment.

---

## License

UNLICENSED — private evaluation project.
