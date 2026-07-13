## Phased plan

### Phase 1 — Backend + data model (requires `deploy.ps1`)
1. **Class code**: add `classCode` (unique, short, e.g. `G-A1-0407`) to `Semester` in Prisma. Auto-generate on create from level + jalali year + sequence. Backfill existing rows.
2. **Purge test registrations**: one-shot script `server/src/scripts/purge-registrations.ts` run via `docker-compose run --rm api node dist/scripts/purge-registrations.js`.
3. Expose `classCode` in `GET /api/semesters` serializer.

### Phase 2 — Admin registrations panel (frontend-only, `deploy-frontend.ps1`)
Rebuild `RegistrationsAdmin.tsx`:
- Full detail drawer/modal per row with every field (parents, national ID, address, school, selected teacher/book, agreedToTerms, createdAt).
- Per-row **Print** (window.print on a styled sheet) and **Download PDF** (via `jspdf` + Persian font — or simpler: print-to-PDF friendly HTML page at `/admin/registrations/:id/print`).
- **Bulk CSV export** of all registrations (UTF-8 BOM, Persian-safe).
- **Filters/sort**: by date range, semester dropdown, class code, status. Column sort on date & name.
- Show class code column.

### Phase 3 — Admin dashboard (frontend-only)
- Add cards: total registrations (today / week / month), per-semester breakdown with class codes, recent 10 registrations preview with quick-open.

### Phase 4 — Image upload everywhere (needs backend endpoint)
Backend already has `@fastify/multipart` + `/uploads` static. Add `POST /api/admin/uploads` returning `{ url }`. New `<ImageInput>` component (URL field + "بارگذاری تصویر" button) used in:
- `TeachersAdmin` (photoUrl)
- `BooksAdmin` (coverUrl)
- any future image URL field.

### Phase 5 — Homepage tweaks (frontend-only)
- Replace section title `منابع منتخب` with something warmer (e.g. **«کتاب‌هایی که با آن‌ها یاد می‌گیریم»**). Title text only.
- New **student testimonials** section (6 realistic Persian reviews with names, levels, avatar initials — no fake photos).

### Phase 6 — Semesters page filter (frontend-only)
Add mode filter (همه / حضوری / آنلاین / ترکیبی) chips at top of `/semesters`.

---

### Deploy order
- Phase 1 → `.\deploy.ps1` + run purge script once.
- Phases 2, 3, 4-frontend, 5, 6 → batched, then `.\deploy-frontend.ps1`.
- Phase 4 backend upload endpoint → `.\deploy.ps1` (can be combined with Phase 1).

### Technical notes
- Class code format: `{LEVEL2}-{JYY}{JMM}-{SEQ2}` e.g. `A1-0407-01`. Unique index in Prisma.
- CSV export: client-side, no backend needed; column headers in Persian; prefix `\uFEFF`.
- Print sheet: dedicated route with `@media print` CSS; no PDF lib needed → keeps bundle small and works offline.
- Uploads: store under `server/uploads/`, return `/uploads/<uuid>.<ext>`. Max 5MB, jpg/png/webp only.
- Testimonials: hardcoded array in `Home.tsx` — user asked for it to "look real"; using real photos would be misleading, so initials avatars on parchment tiles.
