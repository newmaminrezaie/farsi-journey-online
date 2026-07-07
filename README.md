# آموزشگاه زبان های گویا — HiGooya Language Academy

Persian-first (RTL) React SPA for HiGooya Language Academy in گناباد.
Front-end only — all data is stored in the browser's `localStorage` with a clean
async API layer so a real backend can slot in later without touching components.

## Stack

- Vite 5 + React 18 + TypeScript
- Tailwind CSS **v3** + shadcn/ui primitives
- react-router-dom v6
- @tanstack/react-query (data layer)
- framer-motion (motion)
- react-multi-date-picker (Jalali calendar)
- Self-hosted fonts: Vazirmatn Variable + Estedad (no Google Fonts / no CDN)
- `sonner` for toasts

## Scripts

```bash
npm install                 # install (uses --legacy-peer-deps if needed)
npm run dev                 # dev server at http://localhost:8080
npm run build               # production build to dist/
npm run preview             # preview the built dist/
```

## What's inside

Public site
- `/` Home (hero, active semesters, teachers, featured books, CTA)
- `/about` About the institute
- `/teachers` Teachers grid
- `/semesters` List of open semesters (Jalali dates)
- `/semesters/:id` Semester detail + inline registration form
- `/register` Standalone registration / consultation form
- `/shop` Book catalog + filters + search
- `/shop/:id` Book detail
- `/cart` Cart
- `/checkout` Checkout (Zarinpal & cash-on-delivery, offline for now)
- `/order/:refCode` Order confirmation
- `/contact` Contact + quick message form

Admin panel — `/admin` (default: `admin` / `higooya1403`)
- Dashboard with counters and last activity
- CRUD for Books, Semesters, Teachers
- Orders (change status)
- Registrations (change status)

## Data layer

Everything reads/writes through `src/lib/api.ts`. Each function has an
async signature that mirrors a REST call, so replacing localStorage with
`fetch('/api/...')` later is a drop-in change — no component edits.

```ts
// src/lib/api.ts
export const booksApi = {
  async list(): Promise<Book[]> { … },
  async create(input): Promise<Book> { … },
  async update(id, patch): Promise<Book | undefined> { … },
  async remove(id): Promise<void> { … },
};
```

Seed data lives in `src/lib/seed.ts` and runs once on first load
(`seedIfEmpty()` from `main.tsx`). Clear seeded data by deleting the
`higooya:*` keys in localStorage.

## Design system

Tokens are HSL CSS variables in `src/index.css`, mapped in
`tailwind.config.ts`:

- `--primary` deep navy #0F2350 (dominant)
- `--gold` saffron #D4A017 (secondary)
- `--turquoise` #2AA6A0 (tags/badges)
- `--parchment` #FBF6EC (background)
- Persian geometric tile SVG patterns embedded inline as CSS `background-image`
  (`--tile-navy`, `--tile-gold`) — no external image requests
- Photos get a `.warm-photo` treatment (subtle sepia + navy shadow + gold rim)

Add new tokens by editing `:root` in `src/index.css` and, if you want
Tailwind class utilities, add them under `theme.extend.colors` in
`tailwind.config.ts`.

## Offline / Iranian-VPS readiness

- Every dependency is bundled — no runtime references to Google Fonts,
  jsdelivr, cdnjs, or any non-Iranian CDN.
- The only remote URLs left are Unsplash image URLs used for seed data
  (books, teachers, hero). To go fully offline, download the images once
  and swap the URLs in `src/lib/seed.ts` for local `src/assets/*` imports.
- `npm run build` produces a static `dist/` — SCP the folder to your VPS
  and serve it with Nginx (a sample block is at the end of this file).

## Roadmap (Phase 2 — backend)

The frontend already assumes:
- Zarinpal merchant ID for online payment
- Admin Telegram notifications for new orders / registrations
- Real semester capacity checks on the server

When we build the backend, the plan is:
1. Node.js + Express + `better-sqlite3` in a `server/` folder inside this repo
2. Replace each `src/lib/api.ts` function body with a `fetch('/api/…')` call
3. Keep the same types — components stay untouched
4. Deploy alongside the SPA on the same VPS, Nginx proxying `/api` to Node

## Nginx sample block

```nginx
server {
  listen 80;
  server_name higooya.ir;
  root /var/www/higooya/dist;
  index index.html;

  # SPA fallback
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Cache static assets aggressively
  location /assets/ {
    expires 30d;
    add_header Cache-Control "public, immutable";
  }
}
```

## Notes

- Admin credentials are hard-coded for the front-end mock. In production
  they'll come from server env vars (`ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH`).
- The Telegram notifier and Zarinpal merchant flow will live entirely on
  the server — the front-end already collects the customer info and
  payment-method preference.
