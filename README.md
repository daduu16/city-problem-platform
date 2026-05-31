# Municipal Incident Platform

Enterprise-grade municipal incident dispatch and analytics platform (GIS + dispatch center + incident CRM).

**Separate from `city-problem-platform`** — this is a standalone monorepo.

## Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, TypeScript, Vite, TanStack Query, Zustand, React Router, Mapbox (react-map-gl), AG Grid, Recharts, Socket.IO client, Tailwind, React Hook Form + Zod |
| Backend | NestJS, Prisma, PostgreSQL + PostGIS, Redis, Socket.IO, JWT + RBAC |
| Mobile | Expo, React Native, TypeScript, React Navigation |
| DevOps | Docker Compose, NGINX (production) |

## Quick start

### Run everything (web + mobile + infra)

From the repo root (after `cp .env.example .env` and [first-time database setup](#first-time-database-setup)):

```bash
npm install
npm run start:all
```

This starts Postgres/Redis, then backend (`:3001`), frontend (`:5173`), and Expo (`:8081`).  
Web-only (no mobile): `npm run dev`.

### First-time database setup

Required **once** on a fresh clone (or after pulling new Prisma migrations). Postgres must be running (`docker compose up -d postgres redis`).

From the **repo root**:

```bash
cd backend && npx prisma migrate dev && npm run prisma:seed
```

This applies all migrations to the local database and loads demo users, categories, geozones, and sample incidents (see [Demo accounts](#demo-accounts)).

Run the same command again after `git pull` if `backend/prisma/migrations/` changed. For production-like deploys use `npx prisma migrate deploy` instead of `migrate dev`.

### 1. Infrastructure

```bash
cp .env.example .env
docker compose up -d postgres redis
```

### 2. Backend

```bash
cd backend
npm install
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

(Single command from repo root: see [First-time database setup](#first-time-database-setup).)

API: `http://localhost:3001`  
Swagger: `http://localhost:3001/api/docs`

Groq prompt endpoint:

- Set `GROQ_API_KEY` in `backend/.env` or the root `.env` used by Docker Compose.
- Optional: set `GROQ_MODEL`; default is `openai/gpt-oss-120b`.
- Optional: set `GROQ_VISION_MODEL`; default is `meta-llama/llama-4-scout-17b-16e-instruct`.
- In Swagger, call public `POST /ai/prompt` with `systemPrompt`, `userPrompt`, and optionally an `image` file. Image requests use `GROQ_VISION_MODEL`.
- AI answers are instructed by the backend to respond in Azerbaijani by default.

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Set VITE_MAPBOX_TOKEN for full map features
npm install
npm run dev
```

UI: `http://localhost:5173`

### 4. Mobile

Start the backend first (`npm run dev:backend`), then:

```bash
cd mobile
npm install
npm start
```

The app talks to **http://localhost:3001** (or your machine LAN IP on a physical device via `EXPO_PUBLIC_API_URL` in `mobile/.env`).

Mobile app uses the NestJS backend compatibility endpoints under `/api/*`:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/news`
- `GET /api/notifications`
- `GET /api/problems`
- `POST /api/problems`

### Demo accounts

| Email | Password | Role |
|-------|----------|------|
| user@municipal.local | 123456 | Dispatcher (quick demo) |
| admin@municipal.local | 123456 | Super Admin |
| dispatcher@municipal.local | 123456 | Dispatcher |
| executor@municipal.local | 123456 | Field Worker |
| analyst@municipal.local | 123456 | Analyst |
| azeriqaz@municipal.local | 123456 | Utility Operator (gas only) |
| viewer@municipal.local | 123456 | Viewer |

All seed users share the password **123456** (reset on every `npm run seed` in `backend`).

## Architecture

```
frontend/          React SPA (dispatcher dashboard)
backend/           NestJS API + WebSocket gateway
mobile/            Expo React Native citizen app
docker-compose.yml PostGIS + Redis
nginx/             Reverse proxy (production)
```

### Core domains

- **Dashboard** — KPIs, SLA %, charts (Recharts)
- **Map** — incidents, clusters, heatmap, geozones (Mapbox)
- **Incidents** — AG Grid table, filters, bulk actions
- **Incident detail** — drawer with timeline, attachments, SLA
- **Realtime** — Socket.IO (`incident:*` events)
- **RBAC** — ADMIN, DISPATCHER, EXECUTOR, ANALYST, MOBILE_INSPECTOR

### Narimanov district boundary (area + polygon)

Extracted from `frontend/azrbaycan_rayonlar.geojson` into `backend/data/narimanov-district/` (`boundary.geojson`, `manifest.json` with area km², perimeter, vertex count).

```bash
cd backend
npm run district:extract
```

API (JWT + `view_map`):

- `GET /districts/narimanov` — polygon + `positions` + area metadata
- `GET /districts/narimanov/manifest` — summary only

### Narimanov places (GeoJSON by TYPE)

Objects for **Nərimanov** district are extracted from `frontend/azrbaycanda_obyektlr_v_mkanlar.geojson` into `backend/data/narimanov-places/` (one file per `TYPE` + `all.geojson` + `manifest.json`).

```bash
cd backend
npm run places:extract
```

API (JWT + `view_map`):

- `GET /places/narimanov` — all points
- `GET /places/narimanov/manifest` — types and counts
- `GET /places/narimanov/types/:type` — e.g. `HOSPITAL`, `SCHOOL`

Annual refresh: cron **1 January 03:00 UTC** (`OpenDataRefreshScheduler`) for district + places. Set `DISTRICT_SOURCE_URL` / `PLACES_SOURCE_URL` in `.env` to download new datasets before re-extracting.

```bash
cd backend
npm run opendata:extract   # district + places
```

### PostGIS

Migration `0002_postgis` enables spatial queries (radius search, intersections). Prisma stores `lat`/`lng`; raw SQL uses `location` geometry column.

## Production

```bash
docker compose --profile production up -d
```

## Environment

See `.env.example` for all variables.
