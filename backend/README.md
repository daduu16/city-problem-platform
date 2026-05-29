# City Problem Backend

Backend `Express + Prisma + PostgreSQL (Neon)` ilə işləyir.

## 1) Quraşdırma
```bash
cd backend
npm install
```

## 2) `.env` doldur
`.env.example` faylını `.env` kimi kopyala:
```powershell
Copy-Item .env.example .env
```

Minimum:
- `DATABASE_URL`
- `JWT_SECRET`

SMTP (real email üçün):
- `MAIL_HOST=smtp.gmail.com`
- `MAIL_PORT=587`
- `MAIL_SECURE=false`
- `MAIL_USER=sizin_email@gmail.com`
- `MAIL_PASS=Gmail App Password`
- `MAIL_FROM=sizin_email@gmail.com`

## 3) Prisma
```bash
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```

## 4) İşə sal
```bash
npm run dev
```

## Auth axını
- `POST /api/auth/register` → user yaradır, verification code emailə göndərir
- `POST /api/auth/verify-email` → email təsdiqi
- `POST /api/auth/resend-code` → kodu yenidən göndərir
- `POST /api/auth/login` → yalnız təsdiqlənmiş email ilə login
- `POST /api/auth/forgot-password` → şifrə yeniləmə

Qeyd: SMTP dəyərləri boşdursa, sistem fallback olaraq kodu backend logunda göstərir.

