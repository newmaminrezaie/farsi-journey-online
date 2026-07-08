# HiGooya API

Node 20 + Fastify + Prisma + Postgres. Deploys via the top-level `docker-compose.yml`.

## Local dev

```bash
cp ../.env.example ../.env         # fill in POSTGRES_PASSWORD, JWT_SECRET, BOOTSTRAP_ADMIN_PASSWORD at minimum
docker compose up -d db
npm install
npm run prisma:migrate:dev -- --name init
npm run seed:admin
npm run dev                        # http://localhost:3000
```

Health check: `GET /api/health`.

## Auth

Multi-staff. Roles: `admin` (full) and `staff` (daily ops, no destructive actions).
JWT lives in an httpOnly `hg_token` cookie for 12h. Bootstrap first admin with `npm run seed:admin` (reads `BOOTSTRAP_ADMIN_*` from env). Additional staff are created through `POST /api/admin/staff/`.

## Notifications

See [`src/notify/`](src/notify/). Two channels:

- **Bale** (`BALE_BOT_TOKEN`) — primary, reachable from Iran directly.
- **Telegram** (`TELEGRAM_BOT_TOKEN` + `TELEGRAM_PROXY_URL`) — optional, routed through an outbound HTTP/HTTPS/SOCKS5 proxy since `api.telegram.org` is blocked from Iran.

The API never calls the bot providers inline. Business logic inserts rows into `notifications` (inside the same DB transaction as the payment) and a background worker polls every 10s, dispatches, and retries with exponential backoff (6 attempts, up to 12h between). Failures land in the admin panel with a "Retry" button.

Recipients: each `StaffUser` has optional `baleChatId` / `telegramChatId` plus `notifyOn[]`. Env vars `BALE_ADMIN_CHAT_IDS` / `TELEGRAM_ADMIN_CHAT_IDS` are the fallback used when nobody is subscribed.

Test a chat ID from the admin panel: `POST /api/admin/notify/test` with `{ channel, chatId, text? }`.

## Phase status

- ✅ Phase 1: schema, auth, staff, notifications, CRUD for teachers/courses/semesters/classes/students/books, seed
- ⬜ Phase 2: public registration + Zarinpal
- ⬜ Phase 3: book shop orders
- ⬜ Phase 4: dashboard, CSV import, exports, audit log viewer

## Repo layout

```
server/
  Dockerfile
  package.json
  tsconfig.json
  prisma/schema.prisma
  src/
    index.ts
    lib/prisma.ts
    middleware/auth.ts
    notify/
      channels.ts       ← Bale + Telegram-via-proxy dispatchers
      enqueue.ts        ← call from inside DB transactions
      templates.ts      ← Persian HTML message templates
      worker.ts         ← poll-and-retry dispatcher
    routes/
      auth.ts staff.ts notify.ts
      teachers.ts courses.ts semesters.ts classSessions.ts
      students.ts books.ts
    scripts/seed-admin.ts
```
