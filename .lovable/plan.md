
# HiGooya Backend Proposal (revised — with Bale/Telegram notifications)

Goal: a self-hosted backend + admin panel that runs entirely on the Iranian VPS, matches the institute's real workflow (80 courses × teachers × semesters, student numbers, enrollments, book shop), sends admin notifications via **Bale (primary) + Telegram (optional, via proxy)**, and deploys with `docker compose up`.

---

## 1. Stack

- **Runtime:** Node.js 20 LTS + TypeScript
- **Framework:** Fastify (small, fast, first-class JSON schema validation)
- **ORM:** Prisma
- **Database:** **PostgreSQL 16**, self-hosted
- **Auth:** JWT in httpOnly cookie + argon2id; `staff_users` table with roles
- **File uploads:** local disk under `/var/www/higooya/uploads/`, served by nginx
- **Payments:** Zarinpal REST
- **Notifications:** Bale Bot API (native, reachable from Iran) + optional Telegram via configurable outbound proxy
- **Container:** one `docker-compose.yml` — `db` (postgres) + `api` (node) + `backup` (cron)

### Why Postgres

At your scale (~1.5k active, ~5k lifetime, few thousand class sessions, ~20 concurrent at peaks):
- Real transactions for enroll → decrement seat → record payment (SQLite locks the whole DB under bursts).
- Bulk `COPY` for CSV import of thousands of legacy students.
- `pg_dump` is boring, tested, easy to off-site.
- Room for full-text student search and dashboard materialized views without switching engines.

---

## 2. Deployment shape

```
/var/www/higooya/
  dist/                ← SPA (includes /admin/*)
  uploads/             ← teacher photos, book covers, imports
  backups/             ← daily pg_dump + uploads tar
  docker-compose.yml
  server/              ← Fastify + Prisma
```

`docker-compose.yml` services:
1. **db** — `postgres:16`, volume `./pgdata`, localhost-only
2. **api** — Fastify app, `.env`, exposed on `127.0.0.1:3000`
3. **backup** — alpine + cron, nightly 03:00 Tehran:
   - `pg_dump -Fc` → `backups/higooya-YYYY-MM-DD.dump`
   - `tar czf backups/uploads-YYYY-MM-DD.tar.gz uploads/`
   - retain 30 days
   - optional off-site via `rclone` if `.env` has a remote configured

Nginx (already on host): `/api/` → `127.0.0.1:3000`, `/uploads/` → `alias /var/www/higooya/uploads/;`.

---

## 3. Data model (rough)

```text
staff_users(id, username, password_hash, full_name, role, telegram_chat_id?, bale_chat_id?, notify_on[], created_at)
  role ∈ {admin, staff}
  notify_on[] ⊂ {enrollment_paid, book_order_paid, book_order_new, registration_new}

teachers(id, name_fa, name_en, bio_fa, photo_url, specialties[], active, created_at)

courses(id, code, title_fa, level, category, description_fa, active, created_at)

semesters(id, title_fa, jalali_year, season, starts_on, ends_on, registration_status, created_at)

class_sessions(id, course_id, teacher_id, semester_id,
               schedule_fa, mode, capacity, seats_taken,
               price_toman, status, notes, created_at)
  UNIQUE(course_id, teacher_id, semester_id)

students(id, student_number UNIQUE, first_name, last_name, father_name,
        phone, national_id UNIQUE NULLABLE, birth_date, address, note, created_at)
  student_number = <jalali_year><zero-padded seq>  (e.g. 14050234)

enrollments(id, student_id, class_session_id, semester_id,
           status, price_toman, amount_paid_toman,
           payment_method, payment_ref, enrolled_at)
  status ∈ {pending, active, completed, cancelled, refunded}
  UNIQUE(student_id, class_session_id)

books(id, title_fa, author, level, category, description_fa,
      cover_url, price_toman, stock, active, created_at)

book_orders(id, ref_code, customer_name, phone, address, note,
            subtotal_toman, status, payment_method,
            zarinpal_authority, zarinpal_ref_id, created_at)
book_order_items(id, order_id, book_id, title_fa, qty, unit_price_toman)

payments(id, kind, target_id, amount_toman, provider,
         authority, ref_id, status, raw_response, created_at)

notifications(id, event, channel, recipient_chat_id, payload_json,
              status, attempts, last_error, sent_at, created_at)
  event ∈ {enrollment_paid, book_order_paid, book_order_new, registration_new}
  channel ∈ {bale, telegram}
  status ∈ {queued, sent, failed}

audit_log(id, actor_id, action, entity, entity_id, diff_json, created_at)
```

Invariants (in transactions):
- Zarinpal-pending enrollment does NOT increment `seats_taken`.
- Verify webhook: transactionally activate + increment seats + insert `notifications` row per subscribed admin; if capacity exceeded, refund + `cancelled`.
- Manual admin enrollments go straight to `active` + increment seats.

Indexes: `students(phone)`, `students(national_id)`, `students(student_number)`, `enrollments(semester_id, status)`, `class_sessions(semester_id)`, `notifications(status, created_at)`.

---

## 4. Notification service (Bale primary, Telegram optional)

This is a dedicated module (`server/src/notify/`) with a **queue-and-retry** design so a failed proxy hop or a Telegram outage never breaks a payment flow.

### 4.1 Trigger points

The API code never calls Bale/Telegram inline. Instead, inside the same DB transaction that activates an enrollment or a paid book order, it inserts one row into `notifications` per subscribed staff member per enabled channel. A background worker (in the same Node process, `setInterval` every 10s, or `pg-boss` if we want a real queue) picks up `status='queued'` rows and dispatches them.

Events that fire:
- `enrollment_paid` — student paid via Zarinpal or admin marked cash-paid
- `registration_new` — new student registered (before payment) — useful for staff to see interest
- `book_order_paid`
- `book_order_new` — cash-on-delivery order

### 4.2 Channels

Two providers implement one interface:

```ts
interface NotifyChannel {
  name: 'bale' | 'telegram';
  send(chatId: string, text: string): Promise<{ ok: true } | { ok: false; retryable: boolean; error: string }>;
}
```

**Bale (primary):**
- Endpoint: `https://tapi.bale.ai/bot<TOKEN>/sendMessage`
- Reachable from Iranian VPS directly, **no proxy needed**.
- Bot token stored as `BALE_BOT_TOKEN` env var.
- Bale's Bot API is Telegram-compatible for `sendMessage` — same JSON shape (`chat_id`, `text`, `parse_mode: 'HTML'`).

**Telegram (optional):**
- `api.telegram.org` is blocked from Iran, so requests are routed through an outbound HTTP(S) proxy configured by env var:
  - `TELEGRAM_PROXY_URL` — e.g. `http://user:pass@proxy.example.com:8080` or `socks5://…`
  - `TELEGRAM_BOT_TOKEN`
- If `TELEGRAM_BOT_TOKEN` is unset, Telegram channel is disabled and no rows are queued for it. So Telegram is truly opt-in — a deploy with only Bale configured just works.
- Implementation uses `undici`'s `ProxyAgent` (HTTP/HTTPS) or `socks-proxy-agent` (SOCKS) based on URL scheme.
- The proxy URL is the ONLY thing that changes when the boss's proxy provider changes — no code edits, no redeploy required (systemd/docker restart of the api service is enough).

### 4.3 Recipients

Two ways to configure who gets what:

1. **Per-staff, in the admin panel.** Each `staff_users` row has:
   - `bale_chat_id` (optional)
   - `telegram_chat_id` (optional)
   - `notify_on[]` — which events to receive
   A "Test notification" button on the staff profile page sends a hello via each configured channel to verify chat IDs work.
2. **Fallback global admin chats** via env: `BALE_ADMIN_CHAT_IDS`, `TELEGRAM_ADMIN_CHAT_IDS` (comma-separated). Used if no staff member is subscribed to that event. Handy for initial deploy before staff configure their own IDs.

To get a chat ID: staff messages the bot once with `/start`, the bot replies with their numeric chat ID, they paste it into their profile. A tiny inbound handler is added (webhook for Bale, `getUpdates` polling as fallback for Telegram if proxy allows).

### 4.4 Message templates (Persian, HTML)

Rendered server-side. Example for `enrollment_paid`:

```
✅ <b>ثبت‌نام جدید</b>
دانش‌آموز: {full_name} (شماره {student_number})
دوره: {course_title} — استاد {teacher_name}
ترم: {semester_title}
مبلغ پرداختی: {amount_toman} تومان
شناسه پرداخت: {payment_ref}
```

All templates live in `server/src/notify/templates.ts` and are easy to tweak without touching business logic.

### 4.5 Retry + failure handling

- Worker picks `status='queued'` FIFO, ~10 at a time.
- On network failure or 5xx: mark `status='queued'` again, `attempts += 1`, exponential backoff (1m, 5m, 30m, 2h). After 6 attempts → `status='failed'`, `last_error` recorded, surfaced in admin dashboard under "Failed notifications" with a retry button.
- On 4xx (bad chat ID, blocked): `status='failed'` immediately, no retry.
- All dispatch attempts logged in `notifications.payload_json` / `last_error` for debugging.

Payments never wait on notifications — the Zarinpal verify handler returns success as soon as the DB transaction commits.

### 4.6 Env vars summary

```
BALE_BOT_TOKEN=...                              # required for Bale
BALE_ADMIN_CHAT_IDS=123,456                     # optional fallback

TELEGRAM_BOT_TOKEN=...                          # optional; unset = Telegram disabled
TELEGRAM_PROXY_URL=http://user:pass@host:port   # required IF Telegram token is set
TELEGRAM_ADMIN_CHAT_IDS=789,101                 # optional fallback
```

---

## 5. Returning-student lookup, CSV import, auth, admin panel location

(Unchanged from before — kept short here.)

- **Student number:** lookup by national_id → phone → else create `<jalali_year><seq>` from a per-year Postgres sequence. Show "Welcome back, is this you?" before proceeding.
- **CSV/Excel import:** `/admin/students/import` — download xlsx template, upload, Zod-validate row by row, preview green/yellow/red, commit in one transaction with `COPY` for inserts and `UPDATE` for matches. Downloadable import report.
- **Auth:** multi-staff (`admin` and `staff` roles), argon2id, httpOnly JWT cookie, audit log on every mutation, first admin bootstrapped via `npm run seed:admin`. No email reset (institute has no SMTP) — admins reset staff passwords in the panel.
- **Admin panel location:** same React SPA under `/admin/*`. One build, one deploy. The current `src/lib/api.ts` has its function bodies swapped from localStorage to `fetch('/api/...')`; **signatures stay the same**, so existing pages don't need rewrites.

---

## 6. Phased delivery

**Phase 1 — Foundation**
- docker-compose (db + api + backup), Prisma schema + migrations, seed
- Auth + staff CRUD (incl. `bale_chat_id`, `telegram_chat_id`, `notify_on`)
- CRUD APIs: teachers, courses, semesters, class_sessions, students
- Swap admin pages from localStorage → real API
- New admin pages: Courses catalog, Students (list + detail + history)
- **Notification module scaffolded** (Bale + Telegram-via-proxy channels, worker, templates, `/admin/notifications/test`)
- Updated DEPLOY.md with env vars including Bale + optional Telegram proxy
→ **Check in.**

**Phase 2 — Public registration + Zarinpal**
- Public flow: semester → course → class → student form (returning-student lookup) → confirm → Zarinpal → verify → success
- Seat transactions
- Admin: enrollments list + manual enrollment
- **Fires `enrollment_paid` + `registration_new` notifications**
→ **Check in.**

**Phase 3 — Book shop backend**
- Books CRUD (real API), stock decrement on paid orders
- Public cart → checkout → Zarinpal (reuses Phase 2 payment module)
- Admin orders: filter, mark shipped/completed, print packing slip
- **Fires `book_order_paid` / `book_order_new`**
→ **Check in.**

**Phase 4 — Reports + import + polish**
- Dashboard: active students this semester, new enrollments/week, revenue, near-capacity classes, top books
- Student detail: full history + total paid
- CSV/Excel bulk import
- xlsx exports (enrollments per semester, orders)
- Audit log viewer, failed-notifications viewer + retry
- Off-site backup (name your Iranian S3-compatible provider)
→ **Ship.**

---

## 7. Things I need from you to start Phase 1

1. **Approve this proposal.**
2. Confirm **Postgres + Prisma + Fastify** — or say "use X".
3. Confirm **multi-staff auth with roles** (vs single shared login).
4. VPS hostname + whether Docker is already installed.
5. For notifications (needed in Phase 1 to test the scaffolding):
   - Create a Bale bot via `@botfather_bot` on Bale, send me the token via `add_secret` when I ask (not now).
   - Your Bale chat ID (message the bot with `/start` — the bot will echo it once we deploy).
   - Whether you want Telegram at all. If yes: what proxy URL should be used? (SOCKS5 or HTTP — any Iranian VPN gateway or a proxy in a nearby country works.)
6. For Phase 2: Zarinpal merchant ID (sandbox first, later via `add_secret`).

Nothing gets built until you say go.
