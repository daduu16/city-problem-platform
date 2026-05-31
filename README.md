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

## Prerequisites

- **Node.js** 20+ and **npm**
- **Docker Desktop** (Postgres + Redis via Compose)
- Ports free: **5434** (Postgres), **6380** (Redis), **3001** (API), **5173** (web), **8081** (Expo)

Optional: `GROQ_API_KEY` in `.env` / `backend/.env` for AI endpoints; `VITE_MAPBOX_TOKEN` in `frontend/.env` for full map tiles.

---

## Запуск с нуля после `git pull`

Все переменные окружения уже в репозитории (`.env`, `backend/.env`, `frontend/.env`, `mobile/.env`) — копировать `.env.example` не нужно.

```bash
git pull
cd municipal-incident-platform

# 1) Зависимости (root + backend + frontend + mobile)
npm install
npm run install:all

# 2) База: Docker Postgres/Redis, миграции, демо-данные
npm run db:init

# 3) Весь стек (API + веб + Expo)
npm start
```

**Только веб** (без мобильного): после шагов 1–2 выполните `npm run dev`.

| Сервис | URL |
|--------|-----|
| Web UI | http://localhost:5173 |
| API / Swagger | http://localhost:3001 · http://localhost:3001/api/docs |
| Expo | http://localhost:8081 (QR в терминале) |

**Демо-вход:** `user@municipal.local` / `123456` (остальные аккаунты — [ниже](#demo-accounts)).

### Телефон (Expo Go, не симулятор)

`localhost` на телефоне — это сам телефон. После pull один раз с ноутбука в корне репо:

```bash
npm run setup:env
```

Перезапустите Expo (`npm start` в `mobile` или общий `npm start`). Телефон и ноутбук — одна Wi‑Fi; файрвол должен пускать **3001**.

---

## Start from scratch (after `git pull`)

Environment files are **committed** in the repo — no `cp .env.example` step.

```bash
git pull
cd municipal-incident-platform
npm install
npm run install:all
npm run db:init
npm start
```

| Command | Purpose |
|---------|---------|
| **`npm start`** | Full stack: deps → Docker → migrate → demo seed → backend + frontend + mobile |
| **`npm run db:init`** | Database only: Docker → migrate → demo seed (same as start, without apps) |
| **`npm run dev`** | Web only (backend + frontend) |
| **`npm run setup:env`** | Refresh `mobile/.env` with your machine LAN IP (physical device) |

### Database maintenance

```bash
npm run db:init                 # migrate + demo seed (one script, idempotent)
npm run db:init -- --force-seed # re-create demo incidents too
npm run db:reset                # docker compose down -v + migrate + full seed
npm run db:verify               # optional health check
```

`npm start` runs the same DB setup automatically (Docker → migrate → seed → apps). The seed always upserts users, categories, and **6 demo executors**; demo incidents are created only on an empty DB (or with `--force-seed`).

Aliases: `npm run init`, `npm run setup` (= `db:init`).

### Troubleshooting

| Symptom | Fix |
|--------|-----|
| `Can't reach database server` | `docker compose up -d --wait postgres redis` — use port **5434** in `DATABASE_URL` |
| Auth failed for Postgres | `npm run db:reset` (wipes local Docker DB volume) |
| API errors with backend “up” | `npm run db:init` |
| Mobile mock data / unreachable | `npm run setup:env`, same Wi‑Fi, allow TCP **3001** |

---

## Environment files (in repo)

| File | Used by |
|------|---------|
| `.env` | Docker Compose, shared defaults |
| `backend/.env` | NestJS, Prisma |
| `frontend/.env` | Vite (`VITE_*`) |
| `mobile/.env` | Expo (`EXPO_PUBLIC_API_URL`) |

Local overrides (not committed): `.env.local`, `backend/.env.local`, etc.

**Production:** change `JWT_SECRET`, `POSTGRES_PASSWORD`, and do not use committed dev secrets.

---

## Demo accounts

| Email | Password | Role |
|-------|----------|------|
| user@municipal.local | 123456 | Dispatcher (quick demo) |
| admin@municipal.local | 123456 | Super Admin |
| dispatcher@municipal.local | 123456 | Dispatcher |
| executor@municipal.local | 123456 | Field Worker |
| kamran.mammadli@municipal.local | 123456 | Field Worker (mobile executor demo — linked to assignee Kamran Mammadli) |
| analyst@municipal.local | 123456 | Analyst |
| azeriqaz@municipal.local | 123456 | Utility Operator (gas only) |
| viewer@municipal.local | 123456 | Viewer |

Seed password is reset on `npm run db:init -- --force-seed`.

---

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

### Mobile API (`/api/*`)

- `POST /api/auth/register` · `POST /api/auth/login`
- `GET /api/news` · `GET /api/notifications` · `GET /api/problems` · `POST /api/problems`

### Groq AI

Set `GROQ_API_KEY` in `backend/.env`. Swagger: `POST /ai/prompt`.

### Narimanov data

```bash
cd backend
npm run district:extract
npm run places:extract
npm run opendata:extract   # both
```

### PostGIS

Migration `0002_postgis` enables spatial queries. Prisma stores `lat`/`lng`; raw SQL uses `location` geometry.

## Production

```bash
docker compose --profile production up -d
```
