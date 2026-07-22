# Tenths

**Everything, out of ten.** A progressive web app for rating the things you love —
pizza, bagels, sushi, matcha, and more — on a precise 0.0–10.0 scale. Build your
palate, follow friends, and find the best-rated places near you.

Inspired by the "one bite, everybody knows the rules" school of rating, generalized
across any taste category.

## Stack

- **Next.js 16** (App Router) + **React 19** + **Tailwind CSS v4**
- **Clerk** — authentication
- **PostgreSQL** + **Drizzle ORM**
- **Serwist** — service worker / installable PWA
- **Google Places API** (optional) — place search & locations
- Deployed on **Railway**

## Core model

- **Categories** — a curated global list users add to their *palate* (pizza, bagels…).
- **Places** — a rateable venue within a category, deduped on Google Place id.
- **Ratings** — one editable score (0.0–10.0) per user per place, with an optional note.
- **Follows** — a directed social graph powering the feed.

## Local development

```bash
cp .env.example .env.local   # fill in Clerk + DATABASE_URL
npm install
npm run db:setup             # push schema + seed categories
npm run dev
```

### Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Postgres connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk publishable key |
| `CLERK_SECRET_KEY` | ✅ | Clerk secret key |
| `GOOGLE_PLACES_API_KEY` | — | Enables place search; falls back to manual entry |

### Useful scripts

- `npm run db:push` — sync the Drizzle schema to the database
- `npm run db:seed` — seed the starter categories
- `npm run build` — production build (uses webpack for Serwist)

## Deployment (Railway)

1. Provision a PostgreSQL plugin; `DATABASE_URL` is injected automatically.
2. Set the Clerk env vars on the web service.
3. After the first deploy, run `npm run db:setup` against the database to create
   tables and seed categories.
