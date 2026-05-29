# Municipal Incident Platform

Enterprise-grade municipal incident dispatch and analytics platform (GIS + dispatch center + incident CRM).

**Separate from `city-problem-platform`** — this is a standalone monorepo.

## Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, TypeScript, Vite, TanStack Query, Zustand, React Router, Mapbox (react-map-gl), AG Grid, Recharts, Socket.IO client, Tailwind, React Hook Form + Zod |
| Backend | NestJS, Prisma, PostgreSQL + PostGIS, Redis, Socket.IO, JWT + RBAC |
| DevOps | Docker Compose, NGINX (production) |

## Quick start

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

API: `http://localhost:3001`  
Swagger: `http://localhost:3001/api/docs`

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Set VITE_MAPBOX_TOKEN for full map features
npm install
npm run dev
```

UI: `http://localhost:5173`

### Demo accounts

| Email | Password | Role |
|-------|----------|------|
| admin@municipal.local | admin123 | Super Admin |
| dispatcher@municipal.local | admin123 | Dispatcher |
| executor@municipal.local | admin123 | Field Worker |
| analyst@municipal.local | admin123 | Analyst |
| azeriqaz@municipal.local | admin123 | Utility Operator (gas only) |
| viewer@municipal.local | admin123 | Viewer |

## Architecture

```
frontend/          React SPA (dispatcher dashboard)
backend/           NestJS API + WebSocket gateway
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
