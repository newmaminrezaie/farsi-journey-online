# CLAUDE.md — HiGooya Language Academy

Guidance for Claude Code (or any AI agent) continuing this project. Read this file first before editing.

## Project

**HiGooya** — a Persian/RTL website for a language institute. Public marketing site + admin panel. Fully client-side today; the data layer is a mock REST-like API over `localStorage` designed to be swapped for a real backend later without touching components.

The aesthetic: *a well-established institute with wood-paneled walls and Persian carpets*. Not a tech startup, not touristic bazaar kitsch. Restrained geometric Persian motifs, deep navy + saffron + parchment.

## Stack (do not change)

- **React 18 + Vite 5 + TypeScript 5**
- **Tailwind CSS v3** (NOT v4 — required for shadcn/ui and RTL logical-property support)
- **Package manager: npm only.** No bun, no `bun.lock`, no `bunfig.toml`. Use `npm install` and `npm run build`.
- `react-router-dom` v6
- `react-multi-date-picker` with **persian calendar + persian_fa locale** for date inputs. Store internally as ISO `yyyy-mm-dd`.
- `framer-motion`, `lucide-react`, `sonner`, `@tanstack/react-query` (available, not universally used yet)
- Self-hosted fonts via `@fontsource-variable/vazirmatn` and `@fontsource/estedad` — **no CDN font links**.

## Commands

```bash
npm install
npm run dev       # vite dev server on :8080
npm run build     # production build — the only build command to use
npm run lint
```

## Design system (strict)

All colors, gradients, shadows are **semantic HSL tokens** in `src/index.css` and mapped in `tailwind.config.ts`. Never hardcode `text-white`, `bg-black`, `bg-[#...]` in components.

Palette (see `src/index.css` `:root`):
- `--primary` deep navy `#0F2350`
- `--gold` / `--accent` saffron `#D4A017`
- `--parchment` background `#FBF6EC`
- `--turquoise` `#2AA6A0` (sparingly, for chips)
- `--foreground` ink

Typography: **Vazirmatn** body, **Estedad** display headings. Never serif Latin fonts in UI copy (Georgia is used only inside the BrandMark SVG for the letter "G").

Reusable classes defined in `@layer components` of `index.css`:
- `btn-primary`, `btn-gold`, `btn-ghost`
- `chip`, `chip-gold`
- `tile-bg-navy`, `tile-bg-gold` — geometric Persian tile SVG patterns (inline data URIs)
- `warm-photo`, `warm-photo-overlay` — sepia-warm framed photos
- `gold-underline`, `section-divider`

Custom shadows: `shadow-navy`, `shadow-gold`, `shadow-soft`.
Custom bg gradients: `bg-grad-hero`, `bg-grad-gold`.

### Aesthetic constraints (explicit user rules)

- No trendy/modern SaaS look. No purple/indigo gradients on white. No default Inter/Poppins.
- No excessive whitespace.
- Persian visual elements must feel **modernized and restrained**, not ornate or touristic.
- Every decorative element must be geometric.

## RTL

The whole app is RTL. `index.html` sets `dir="rtl" lang="fa"`. Use logical Tailwind utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`) rather than `ml-*` / `mr-*` where direction matters. The admin sidebar is pinned `right-0` and `main` uses `mr-64`.

## Structure

```
src/
  App.tsx                       # Routes (public layout + /admin)
  main.tsx
  index.css                     # Design tokens, component classes, date-picker theme
  components/
    BrandMark.tsx               # Custom SVG logo: 8-point star + Persian "گویا" wordmark + English "G"
    PersianPattern.tsx
    layout/{PublicLayout,SiteHeader,SiteFooter}.tsx
    admin/AdminLayout.tsx
    ui/                         # shadcn primitives (only the ones we use)
  pages/
    Home, About, Teachers, Semesters, SemesterDetail, Register,
    Shop, ShopDetail, Cart, Checkout, OrderSuccess, Contact, NotFound
    admin/{Login,Dashboard,BooksAdmin,SemestersAdmin,TeachersAdmin,OrdersAdmin,RegistrationsAdmin}
  lib/
    api.ts        # teachersApi, semestersApi, registrationsApi, booksApi, cartApi, ordersApi, authApi, formatToman
    storage.ts    # localStorage helpers, uid(), refCode()
    types.ts      # Domain types — do not add fields without updating seed + admin forms
    jalali.ts     # ISO ↔ Jalali conversion helpers
    seed.ts       # Demo data seeder
    utils.ts      # cn()
```

## Data layer contract

`src/lib/api.ts` mirrors REST call shapes on purpose. If/when a backend arrives, replace bodies with `fetch()` — do NOT change signatures or call sites. All prices are **Toman** (integer). Money is formatted via `formatToman()` in `fa-IR` digits.

Admin auth is mock: user `admin` / pass `higooya1403`, session flag in localStorage. Replace with real auth when backend lands.

## Backend (planned, not implemented yet)

When the backend is added it should:
- Notify admin via Telegram bot through the Frankfurt proxy on new orders and registrations.
- Read `TELEGRAM_BOT_TOKEN` and `TELEGRAM_ADMIN_CHAT_ID` from env.

## BrandMark

`src/components/BrandMark.tsx` renders the logo used in the header and admin sidebar. It is a self-contained SVG: an 8-point Persian star (two overlapping rounded squares, navy + gold) with a parchment medallion, 8 orbiting dots, and a bold Georgia **"G"** at the center. Wordmark to the right: **گویا** (xl, black) with **آموزشگاه زبان** underneath (standard spacing between the two words, `tracking-tight`). Do not restore any gold underline in the hero — user removed it.

## Head metadata

`index.html` must have real app-specific `<title>` and `<meta name="description">` in Persian, plus matching `og:title`, `og:description`, `og:type`, `twitter:card`. Never leave the "Lovable App" defaults. Don't set `og:image` unless the user provides an absolute HTTPS URL.

## Conventions

- Persian digits in user-visible numbers: `n.toLocaleString("fa-IR")`.
- Dates: user-facing = Jalali via `jalali.ts` / date picker; storage = ISO.
- Keep components small and focused. Prefer editing over rewriting.
- When user requests a UI change, keep it to presentation — don't touch API/types/business logic unless asked.
- Read files before editing. Batch independent edits.

## Known open items

- Real backend + Telegram notifier
- Zarinpal payment integration (types are ready in `Order`)
- Wire up `react-multi-date-picker` on the semester admin form using persian calendar + persian_fa locale, storing `startsOn` / `endsOn` as ISO
