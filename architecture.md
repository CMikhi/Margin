# Widget-Based Note Taking Platform  
System Architecture Plan

---

# 1. System Overview

This system is a modular note taking platform inspired by block-based tools like Notion where documents are composed of independent widgets.

Each widget supports a different medium such as:

- Text
- Images
- Canvas / Drawings
- Calendars / Daily Events
- Sticky Drawings
- Future extensible widgets

The architecture separates three fundamental concerns:

1. Widget Layout and Placement  
2. Widget Content  
3. Notes (standalone text documents)

---

# 2. High Level Architecture

```text
Client (Next.js)
│
│ HTTPS / REST
▼
Backend API Layer (NestJS 11)
│
├ Auth Service          ──── Redis (session / refresh token store)
├ Users Service
├ Roles Service
├ Widgets Service       ──── Redis (response cache)
├ Notes Service         ──── Redis (response cache)
├ Calendar Service
├ Health Service
│ Redis Pub/Sub (future: realtime events)
▼
Persistence Layer
├ PostgreSQL (TypeORM)
└ Cloudflare R2 (images, canvas snapshots)
```

---

# 3. Core System Components

## 3.1 Client Layer

Responsibilities:

- Render widget layouts
- Manage widget drag, resize, and content editing
- Send batch layout and content updates to backend
- Cache temporary state locally before sync

The client maintains a per-user widget model:

```text
WidgetPlacement
├ id
├ widgetKey (unique per user)
├ x, y, width, height, zIndex
├ type (text | image | canvas | stickyDrawing | calendar | dailyEvents)
├ content (linked WidgetContent)
└ metadata
```

Client operations include:

- Create Widget
- Delete Widget
- Move / Resize Widget
- Update Widget Content
- Bulk replace widget layout

---

# 4. Backend Services

## 4.1 API Gateway (NestJS 11 Backend)

Framework: NestJS 11 (TypeScript)  
Default port: `5200`  
Swagger / OpenAPI docs available at `/api`

### Global Middleware

- `ValidationPipe` — enforces DTO validation (`whitelist`, `transform`, `stopAtFirstError`)
- `LoggingInterceptor` — logs all HTTP requests and responses
- CORS — enabled for all origins in development (restrict in production)

---

## 4.2 Auth Module

Route prefix: `/auth`

Handles user registration, login, token refresh, and identity retrieval.

### Endpoints

```text
POST   /auth/register   Register new user → returns accessToken, refreshToken, user
POST   /auth/login      Authenticate user → returns accessToken, refreshToken, user
PATCH  /auth/refresh    Rotate tokens using a valid refreshToken
GET    /auth/me         Return current authenticated user (requires JWT)
```

### Token Strategy

- Access token: short-lived JWT (default `15m`), `HS256`
- Refresh token: longer-lived JWT (default `7d`), `HS256`
- Refresh tokens are **bcrypt-hashed** before storage in the database
- On refresh, both tokens are rotated; the previous refresh hash is invalidated
- JWT payload contains: `sub` (userId), `role`

### Guards

- `JwtAuthGuard` — validates Bearer token on protected routes
- `BodyRequiredGuard` — rejects requests with missing bodies before hitting route logic

---

## 4.3 Users Module

Route prefix: `/users`

All endpoints require a valid JWT. Admin-only endpoints also require `RolesGuard`.

### Endpoints

```text
GET    /users           List all users (admin only)
GET    /users/me        Return current user profile
PATCH  /users/:uuid     Update user profile (self or admin)
DELETE /users/:uuid     Delete user account (admin only)
```

---

## 4.4 Roles Module

Route prefix: `/roles`

Provides role inspection. Role updates are currently disabled pending an admin escalation refactor.

### Endpoints

```text
GET  /roles/me       Return the authenticated user's role
GET  /roles/:uuid    Return a user's role by UUID (admin only)
```

---

## 4.5 Widgets Module

Route prefix: `/widgets`

All endpoints require a valid JWT. Widgets are scoped per authenticated user.

### Endpoints

```text
GET  /widgets   Return all widget placements for the current user
PUT  /widgets   Bulk replace all widget placements for the current user
```

The `PUT /widgets` endpoint is the primary sync mechanism. The client sends the full widget state for the authenticated user, and the backend performs a transactional bulk replace.

### Payload Limits

- Total body: `10 MB` maximum
- Per-widget content: `500 KB` maximum

---

## 4.6 Notes Module

Route prefix: `/notes`

Full CRUD for standalone text notes. Notes are scoped per authenticated user.

### Endpoints

```text
POST   /notes           Create a new note
GET    /notes           List notes (paginated: limit, offset query params)
GET    /notes/:id       Get a single note by ID
PATCH  /notes/:id       Update a note
DELETE /notes/:id       Delete a note
```

---

## 4.7 Calendar Module

Route prefix: `/calendar`

Manages calendar events with date range queries. Events are scoped per authenticated user.

### Endpoints

```text
POST    /calendar            Create a calendar event
GET     /calendar            Get events within a date range (start, end query params)
PATCH   /calendar/:id        Update a calendar event
DELETE  /calendar/:id        Delete a calendar event
```

---

## 4.8 Health Module

```text
GET  /health   Returns API health, database status, latency, uptime, and environment
```

---

# 5. Database Schema

Database: PostgreSQL  
ORM: TypeORM  
- `synchronize: true` in development (auto-migrates schema)  
- `synchronize: false` in production  
- Connection pool: min `10`, max `30`, idle timeout `60s`

---

## 5.1 Users Table

```text
users
├ id              UUID (PK, auto-generated)
├ username        VARCHAR(64), unique
├ password        VARCHAR(255), bcrypt hash
├ role            ENUM('user', 'admin'), default 'user'
├ refreshTokenHash      VARCHAR(512), nullable
├ refreshTokenExpiresAt TIMESTAMPTZ, nullable
└ createdAt       TIMESTAMPTZ

Indexes:
  idx_users_username  (username)
  idx_users_role      (role)
```

---

## 5.2 Notes Table

```text
notes
├ id         UUID (PK)
├ owner      FK → users.id (CASCADE DELETE)
├ title      TEXT
├ content    TEXT
├ metadata   JSONB, nullable
├ createdAt  TIMESTAMPTZ
└ updatedAt  TIMESTAMPTZ

Indexes:
  idx_notes_owner     (owner)
  gin_notes_metadata  (metadata) — GIN for JSONB search
```

---

## 5.3 Widget Placements Table

Stores layout, type, and a reference to widget content.

```text
widget_placements
├ id          UUID (PK)
├ owner       FK → users.id (CASCADE DELETE)
├ widgetKey   VARCHAR(255) — unique per owner
├ x           INTEGER
├ y           INTEGER
├ width       INTEGER
├ height      INTEGER
├ zIndex      INTEGER, default 0
├ type        ENUM('text' | 'image' | 'canvas' | 'stickyDrawing' | 'calendar' | 'dailyEvents')
├ content_id  FK → widget_contents.id (SET NULL on delete), nullable
├ metadata    JSONB, nullable
├ config      JSONB, nullable (legacy, retained for migration)
├ createdAt   TIMESTAMPTZ
└ updatedAt   TIMESTAMPTZ

Constraints:
  uq_owner_widgetkey  UNIQUE (owner, widgetKey)

Indexes:
  idx_widgets_owner    (owner)
  idx_widgets_position (x, y)
  idx_widgets_z_index  (zIndex)
```

---

## 5.4 Widget Contents Table

Generic content store. Widget type determines how `data` and `dataType` are interpreted.

```text
widget_contents
├ id              UUID (PK)
├ data            TEXT — raw content (plain text, base64 image, or Fabric.js JSON)
├ dataType        ENUM('text' | 'base64Image' | 'fabricJSON')
├ compressedSize  INTEGER, nullable — byte size of compressed content
└ updatedAt       TIMESTAMPTZ
```

---

## 5.5 Calendar Events Table

```text
calendar_events
├ id          UUID (PK)
├ owner       FK → users.id (CASCADE DELETE)
├ title       VARCHAR(255)
├ description TEXT, nullable
├ startAt     TIMESTAMPTZ
├ endAt       TIMESTAMPTZ
├ allDay      BOOLEAN, default false
├ recurrence  JSONB, nullable — recurrence rule object
├ createdAt   TIMESTAMPTZ
└ updatedAt   TIMESTAMPTZ

Indexes:
  idx_calendar_owner          (owner)
  idx_calendar_start_at       (startAt)
  idx_calendar_end_at         (endAt)
  idx_calendar_all_day        (allDay)
  idx_calendar_owner_dates    (owner, startAt, endAt) — composite for range queries
  gin_calendar_recurrence     (recurrence) — GIN for JSONB search
```

---

# 6. Authentication and Authorization

## Authentication

- JWT Bearer tokens issued on login and registration
- Access tokens expire after `15m` (configurable via `JWT_EXPIRATION`)
- Refresh tokens expire after `7d` (configurable via `JWT_REFRESH_EXP`)
- All protected routes use `JwtAuthGuard`

## Authorization (RBAC)

Two roles are supported:

- `user` — standard access, can manage own data
- `admin` — elevated access, can view/delete all users and inspect roles

Roles are enforced with the `RolesGuard` and `@Roles()` decorator.

---

# 7. Logging and Observability

## File-Based Logging

Logs are written to the `logs/` directory:

- `combined` — all log levels
- `error` — error-only log
- `stats` — user activity stats (login, registration events)

`LoggerService` is a custom NestJS logger that writes structured logs to these files.  
`LoggingInterceptor` is applied globally and logs every HTTP request and response.

## Health Endpoint

`GET /health` exposes:

- Database connectivity and latency
- Backend uptime
- Environment mode
- API version

---

# 8. Environment Configuration

Environment variables are loaded via `@nestjs/config`. Required variables:

```text
# Server
PORT                 API port (default: 5200)
NODE_ENV             Environment mode (development | production)

# Database
DB_HOST              PostgreSQL host (default: localhost)
DB_PORT              PostgreSQL port (default: 5432)
DB_USERNAME          PostgreSQL user (default: postgres)
DB_PASSWORD          PostgreSQL password
DB_NAME              PostgreSQL database name (default: margin_dev)

# Auth / JWT
JWT_SECRET           Required in production
JWT_EXPIRATION       Access token TTL (default: 15m)
JWT_REFRESH_EXP      Refresh token TTL (default: 7d)

# Redis (planned)
REDIS_HOST           Redis host (default: localhost)
REDIS_PORT           Redis port (default: 6379)
REDIS_PASSWORD       Redis password, optional
REDIS_SESSION_TTL    Session/token TTL in seconds (default: 604800 — 7 days)
REDIS_CACHE_TTL      Widget/note cache TTL in seconds (default: 300 — 5 minutes)

# Cloudflare R2 (planned)
R2_ACCOUNT_ID        Cloudflare account ID
R2_ACCESS_KEY_ID     R2 access key
R2_SECRET_ACCESS_KEY R2 secret access key
R2_BUCKET_NAME       R2 bucket name
R2_PUBLIC_URL        Public CDN URL for serving stored objects
R2_PRESIGN_TTL       Presigned URL expiry in seconds (default: 3600 — 1 hour)
```

---

# 9. Autosave Strategy

The widgets module uses a bulk-replace pattern rather than per-widget updates.

```text
User edits widget
↓
Local state updates immediately (client-side)
↓
Client debounces updates (configurable interval)
↓
PUT /widgets sends full widget state for the user
↓
Backend performs transactional bulk replace
```

This keeps the API surface simple and reduces the number of database round trips.

---

# 10. Deployment Architecture

```text
Load Balancer
│
├ NestJS Backend Instance(s)
│
PostgreSQL Primary + Replica
```

Containers are deployed with Docker. SSL is enabled when `NODE_ENV=production` (with `rejectUnauthorized: false` for managed database providers).

---

# 11. Not Yet Implemented

The following items are not currently present in the backend. Items marked **[Planned]** have detailed design in later sections.

- **Redis Caching and Session Layer** — [Planned] see Section 13
- **Object Storage (Cloudflare R2)** — [Planned] see Section 14
- **Realtime Collaboration** — no WebSocket layer; Redis pub/sub infrastructure will be laid as part of the Redis work (Section 13) to enable this later
- **Document Revisions / History** — no revision table or diff tracking
- **Document-level Permissions Table** — access is controlled by owner FK per resource
- **Separate per-type widget content tables** — unified `widget_contents` table is used instead

---

# 12. Key Architectural Principles

1. Widget layout (`widget_placements`) is stored separately from widget content (`widget_contents`)
2. All resources are scoped by authenticated owner — no cross-user access without admin role
3. Refresh tokens are hashed before storage; raw tokens are never persisted (will move to Redis)
4. Never store entire documents as a single JSON blob — notes and widgets are discrete entities
5. Input validation is enforced at every API boundary via DTOs and `ValidationPipe`
6. Bulk replace (not partial patch) is used for widget synchronization to keep the sync model simple
7. Binary content (images, canvas drawings) must not be stored in the database — use Cloudflare R2
8. Cache read-heavy, user-scoped data in Redis with short TTLs; always treat cache as evictable

---

# 13. Redis — Caching and Session Layer (Planned)

## Purpose

Redis will serve three roles:

1. **Response cache** — reduce repeated PostgreSQL reads for widget and note data
2. **Session / refresh token store** — move refresh token state out of the `users` table into Redis
3. **Pub/sub infrastructure** — lay the foundation for future realtime collaboration events

---

## 13.1 Response Caching

Target resources are reads of per-user, read-heavy data:

```text
Cached resources:    widgets (GET /widgets), notes list (GET /notes)
Cache key format:    cache:<userId>:<resource>       e.g. cache:abc123:widgets
TTL:                 Configurable via REDIS_CACHE_TTL (default 5 minutes)
Invalidation:        Write operations (PUT /widgets, POST/PATCH/DELETE /notes)
                     must delete the relevant cache key synchronously.
```

### Cache-aside pattern (per request)

```text
Incoming GET request
↓
Check Redis for cache:<userId>:<resource>
↓ HIT                    ↓ MISS
Return cached data       Query PostgreSQL
                         ↓
                         Store result in Redis with TTL
                         ↓
                         Return data
```

The NestJS service layer (e.g. `WidgetsService`, `NotesService`) is responsible for cache reads and invalidation. Controllers are not cache-aware.

---

## 13.2 Session / Refresh Token Store

Currently refresh tokens are hashed and stored in the `users` table (`refreshTokenHash`, `refreshTokenExpiresAt`). This adds write load to the users table on every token rotation.

### Planned change

Move token state to Redis:

```text
Redis key:    session:<userId>
Value:        refreshTokenHash (bcrypt hash of the raw refresh token)
TTL:          Set to REDIS_SESSION_TTL (matches JWT_REFRESH_EXP, default 7 days)
On rotation:  Overwrite the key with the new hash and reset TTL
On logout:    Delete the key immediately
```

The `refreshTokenHash` and `refreshTokenExpiresAt` columns can be removed from the `users` table once this is live.

### Impact on auth flow

```text
Login / Register
  → generate tokens
  → store hash in Redis: SET session:<userId> <hash> EX <ttl>

Token Refresh
  → verify access token (expired is acceptable here)
  → GET session:<userId> from Redis
  → bcrypt.compare(incomingRefreshToken, storedHash)
  → rotate both tokens, overwrite Redis key

Logout (future endpoint)
  → DEL session:<userId>
```

---

## 13.3 Pub/Sub Infrastructure (Future Realtime)

Redis pub/sub channels will be wired during the Redis integration to enable realtime events later without a separate infrastructure change.

```text
Channel naming:  events:<userId>   (per-user events)
Published events (future):
  WIDGET_CREATED
  WIDGET_UPDATED
  WIDGET_DELETED
  NOTE_UPDATED
```

No consumers need to be connected at integration time. The publish calls can be no-ops until a WebSocket gateway subscribes to them.

---

## 13.4 Redis Module Design

- A dedicated `RedisModule` will wrap `ioredis` (or `@nestjs/cache-manager` with a Redis store)
- Injected as a provider into `AuthModule`, `WidgetsModule`, and `NotesModule`
- `RedisService` exposes typed helpers: `get`, `set`, `del`, `publish`
- All cache keys use a consistent prefix schema to avoid collisions

---

# 14. Object Storage — Cloudflare R2 (Planned)

## Purpose

Widgets of type `image` and `canvas` / `stickyDrawing` currently store raw `base64` or Fabric.js JSON as TEXT in `widget_contents.data`. This does not scale. Cloudflare R2 will replace binary content storage.

Cloudflare R2 is S3-compatible (AWS SDK v3 works unchanged) and has no egress fees.

---

## 14.1 What Gets Stored in R2

```text
Widget type       Content stored in R2
──────────────    ────────────────────────────────────────
image             Original uploaded image file
canvas            Fabric.js JSON snapshot exported as a file
stickyDrawing     Same as canvas
```

Text widgets, calendar widgets, and dailyEvents widgets do not use R2.

---

## 14.2 Upload Flow (Presigned URL)

The client never sends binary data through the backend. The backend generates a time-limited presigned URL and the client uploads directly to R2.

```text
1. Client sends POST /widgets/upload-url
   { widgetKey, contentType }           (e.g. "image/png", "application/json")

2. Backend validates the request (auth, content type allow-list)
   Generates a presigned PUT URL via R2 SDK
   Returns: { uploadUrl, objectKey, expiresIn }

3. Client PUTs the file directly to R2 using the presigned URL

4. Client sends PUT /widgets (the normal bulk-replace sync)
   Widget content field contains the R2 objectKey (not the binary)

5. Backend stores objectKey in widget_contents.data
   widget_contents.dataType = 'r2_object_key'
```

---

## 14.3 Serving Stored Objects

Objects are served via the Cloudflare R2 public URL (`R2_PUBLIC_URL`). The backend constructs the full URL when returning widget data:

```text
Stored in DB:   widget_contents.data = "widgets/abc123/img_xyz.png"
Served as:      R2_PUBLIC_URL + "/" + objectKey
                e.g. https://assets.example.com/widgets/abc123/img_xyz.png
```

The frontend uses the returned URL directly. No backend proxy is involved for reads.

---

## 14.4 Bucket Key Structure

```text
widgets/<userId>/<widgetKey>/<filename>

Examples:
  widgets/user-uuid/widget-key-a/image.png
  widgets/user-uuid/widget-key-b/canvas.json
```

This structure makes per-user and per-widget cleanup straightforward.

---

## 14.5 Widget Contents Schema Change

The `widget_contents` table will gain a new `dataType` enum value:

```text
dataType  ENUM('text' | 'base64Image' | 'fabricJSON' | 'r2_object_key')
                                                        ↑ new
```

When `dataType = 'r2_object_key'`:
- `data` stores the R2 object key (e.g. `widgets/<userId>/<widgetKey>/image.png`)
- The full URL is assembled by the backend on read using `R2_PUBLIC_URL`
- `compressedSize` stores the byte size of the uploaded object

The legacy `base64Image` and `fabricJSON` values remain in the enum for backward compatibility but will no longer be written for new uploads.

---

## 14.6 R2 Module Design

- A dedicated `StorageModule` wraps `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`
- Configured entirely from environment variables (`R2_*`)
- `StorageService` exposes: `generatePresignedPutUrl(key, contentType, ttl)`, `deleteObject(key)`
- Injected into `WidgetsModule` for presign URL generation and object cleanup on widget delete
- Content-type allow-list enforced at presign time: `image/png`, `image/jpeg`, `image/webp`, `application/json`
