# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start dev server
npm run build            # Download parquet data + next build
npm run lint             # ESLint
npm run download-data    # Download crime parquet from Hugging Face
npm run db:generate      # Generate Drizzle migrations
npm run db:push          # Push schema to Neon/Postgres
npm run db:studio        # Open Drizzle Studio
```

Drizzle commands use `dotenv -e .env.local` to load env vars. No test framework is configured.

## Architecture

**Next.js 16 App Router** full-stack app — Maryland crime analytics dashboard deployed on Vercel.

### Data layer
- **Crime data:** A ~30MB Parquet file (`data/crime_dataset.parquet`, gitignored) downloaded from Hugging Face at build time. Read once into memory by `src/lib/data-service.ts` using `hyparquet`, then all queries filter/aggregate in-memory. Server-only (`serverExternalPackages` in next.config.ts).
- **User/auth data:** Neon (serverless Postgres) via `@vercel/postgres` + Drizzle ORM. Schema in `src/db/schema.ts`.

### Auth
NextAuth v5 beta with Credentials provider (email + bcrypt password), JWT sessions. Middleware at `src/proxy.ts` protects `/dashboard/*` routes. Adapter: `@auth/drizzle-adapter`.

### API routes (`src/app/api/`)
All are Next.js Route Handlers. Chart endpoints (`/api/charts/*`) and `/api/kpis` do server-side aggregation over the in-memory parquet data. `/api/records` supports pagination/filtering/sorting. `/api/map-points` filters by bounding box + date range. `/api/report` uses haversine distance for radius queries. `/api/geocode` proxies to Nominatim (OpenStreetMap).

### Frontend
- **UI:** Tailwind CSS v4 + shadcn/ui (new-york style) + Radix UI + lucide-react
- **Charts:** Recharts
- **Maps:** Leaflet + react-leaflet + react-leaflet-cluster, always dynamically imported with `ssr: false`
- **Tables:** TanStack Table
- **Pages:** All under `/dashboard` (overview, analytics, records, map, report). Auth pages at `/sign-in`, `/sign-up`.

### Path alias
`@/*` maps to `./src/*`

## Environment

Required vars (see `.env.example`): `POSTGRES_URL`, `AUTH_SECRET`. Additional Neon/Vercel Postgres vars are auto-populated by Vercel. No external API keys needed.
