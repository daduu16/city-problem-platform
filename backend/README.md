# City Problem Backend

Backend `Express + Prisma + PostgreSQL` ile isleyir.

## 1) Qurasdirma
```bash
cd backend
npm install
```

## 2) Local PostgreSQL ayaqa qaldir
Project daxilinde `docker-compose.yml` var:
```bash
docker compose up -d
```

Bu servis avtomatik olaraq asagidaki DB-ni yaradir:
- User: `city_user`
- Password: `city_pass`
- Database: `city_problem`
- Port: `5432`

## 3) `.env` yarat
`.env.example` faylini `.env` kimi kopyala:
```powershell
Copy-Item .env.example .env
```

Minimum:
- `DATABASE_URL`
- `JWT_SECRET`

Default `DATABASE_URL`:
`postgresql://city_user:city_pass@localhost:5432/city_problem?schema=public`

SMTP (real email ucun):
- `MAIL_HOST=smtp.gmail.com`
- `MAIL_PORT=587`
- `MAIL_SECURE=false`
- `MAIL_USER=sizin_email@gmail.com`
- `MAIL_PASS=Gmail App Password`
- `MAIL_FROM=sizin_email@gmail.com`

## 4) Prisma setup
```bash
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```

## 5) Backend-i islet
```bash
npm run dev
```

## Auth axini
- `POST /api/auth/register` -> user yaradir, verification code emaile gonderir
- `POST /api/auth/verify-email` -> email tesdiqi
- `POST /api/auth/resend-code` -> kodu yeniden gonderir
- `POST /api/auth/login` -> yalniz tesdiqlenmis email ile login
- `POST /api/auth/forgot-password` -> sifre yenileme

Qeyd: SMTP deyerleri bosdursa, sistem fallback olaraq kodu backend logunda gosterir.
