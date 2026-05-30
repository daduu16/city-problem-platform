ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "fin_code" TEXT,
ADD COLUMN IF NOT EXISTS "email_verified" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "verification_code" TEXT,
ADD COLUMN IF NOT EXISTS "verification_expires_at" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "news" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "image_url" TEXT NOT NULL,
  "published_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "mobile_notifications" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "mobile_notifications_pkey" PRIMARY KEY ("id")
);
