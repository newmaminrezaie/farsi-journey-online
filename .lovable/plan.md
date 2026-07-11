## Goal

Stop localStorage-only mode. Teachers, semesters, books, and registrations get stored in Postgres on the VPS and are shared across all visitors and browsers. Rebuilds never wipe data.

## What changes

### 1. Backend schema (flatten to match the frontend)

The current Prisma schema was over-engineered (`Course`, `ClassSession`, `Enrollment`, `Student` normalization). The frontend never used any of that. Flatten to what the app actually needs:

- **Semester** — add `level`, `teacherIds String[]`, `scheduleFa`, `capacity`, `seatsTaken`, `priceToman`, `mode`, `status`. Drop the `Course`/`ClassSession`/`Enrollment`/`Student` relations. Old `jalaliYear`/`season`/`registrationStatus` fields removed.
- **Registration** (new table) — captures every field the paper form has: `fullName`, `fatherName`, `birthCertNo`, `nationalId`, `issuedFrom`, `birthPlace`, `schoolDegree`, `universityDegree`, `address`, `phone`, `landline`, `termInterest`, `levelInterest`, `selectedTeacherId`, `note`, `agreedToTerms`, `semesterId` (nullable), `status`, `createdAt`.
- **Teacher**, **Book** — unchanged (already compatible).
- Drop unused tables: `Course`, `ClassSession`, `Enrollment`, `Student`, `BookOrder`, `BookOrderItem`, `Payment`. Book orders + Zarinpal stay on localStorage for now (as we agreed earlier — payment integration is separate work).

### 2. Backend routes

- Rewrite `server/src/routes/semesters.ts` with the flat zod schema. Public `GET`. Staff-only `POST`/`PATCH`/`DELETE`.
- New `server/src/routes/registrations.ts` — public `POST` (so the form works without login), staff-only `GET`/`PATCH`/`DELETE`. Auto-increments `Semester.seatsTaken` on create if `semesterId` set.
- `teachers` and `books` routes stay as-is (they already work).
- Delete stub routes for `courses`, `classSessions`, `students` and remove their registration from `index.ts`.

### 3. Frontend `src/lib/api.ts`

Replace localStorage bodies of `teachersApi`, `semestersApi`, `booksApi`, `registrationsApi` with `fetch("/api/…")` calls. Same function signatures — no page code changes. Response shapes match frontend types (backend already returns snake-free camelCase from Prisma). `cartApi`, `ordersApi`, `authApi` untouched.

### 4. Frontend seed

`src/lib/seed.ts` no longer runs against the network-backed entities. It becomes a no-op (or is removed from `main.tsx`). Demo data comes from a one-time DB seed script on the VPS instead.

### 5. New backend seed script

`server/src/scripts/seed-demo.ts` — inserts the 4 demo teachers, 4 semesters, 6 books if the DB is empty. Idempotent. Run once after `db push`.

## Deploy steps you'll run on the VPS after I push code

```bash
cd /var/www/higooya/server
npm run build
cd ..
npx --prefix server prisma db push --schema server/prisma/schema.prisma --accept-data-loss
docker-compose restart api
docker-compose exec api npm run seed:demo   # optional — only if you want demo rows
```

Then locally: `.\deploy.ps1` to ship the new frontend.

**Note on `--accept-data-loss`:** the old `Semester`/`Student`/`Enrollment` rows will be dropped because their columns change. You've said the data in there was test data, so this is fine. Teacher and Book rows survive.

## What's not in scope this round

- Zarinpal integration (still stubbed; cart/orders remain localStorage — the buyer still sees an order-success page but nothing hits the server yet).
- Real Telegram/Bale notifications (backend queue exists but disabled).
- Multi-staff accounts (single admin user is enough for now).

Approve and I'll implement.
