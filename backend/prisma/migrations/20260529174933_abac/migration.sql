/*
  Warnings:

  - You are about to drop the column `category` on the `incidents` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `incidents` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - Added the required column `category_id` to the `incidents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role_id` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "IncidentScope" AS ENUM ('ALL', 'REGION', 'ASSIGNED', 'ORGANIZATION');

-- DropIndex
DROP INDEX "incidents_category_idx";

-- DropIndex
DROP INDEX "incidents_location_idx";

-- AlterTable
ALTER TABLE "incidents" DROP COLUMN "category",
DROP COLUMN "location",
ADD COLUMN     "category_id" TEXT NOT NULL,
ADD COLUMN     "geozone_id" TEXT,
ADD COLUMN     "organization_id" TEXT,
ADD COLUMN     "subcategory_id" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role",
ADD COLUMN     "default_geozone_id" TEXT,
ADD COLUMN     "organization_id" TEXT,
ADD COLUMN     "role_id" TEXT NOT NULL;

-- DropEnum
DROP TYPE "IncidentCategory";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "incident_scope" "IncidentScope" NOT NULL DEFAULT 'ALL',

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" TEXT,
    "service_owner" TEXT,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_category_access" (
    "user_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "user_category_access_pkey" PRIMARY KEY ("user_id","category_id")
);

-- CreateTable
CREATE TABLE "user_geozone_access" (
    "user_id" TEXT NOT NULL,
    "geozone_id" TEXT NOT NULL,

    CONSTRAINT "user_geozone_access_pkey" PRIMARY KEY ("user_id","geozone_id")
);

-- CreateTable
CREATE TABLE "user_map_layer_access" (
    "user_id" TEXT NOT NULL,
    "layer_key" TEXT NOT NULL,

    CONSTRAINT "user_map_layer_access_pkey" PRIMARY KEY ("user_id","layer_key")
);

-- CreateTable
CREATE TABLE "user_analytics_access" (
    "user_id" TEXT NOT NULL,
    "analytics_key" TEXT NOT NULL,

    CONSTRAINT "user_analytics_access_pkey" PRIMARY KEY ("user_id","analytics_key")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_key_key" ON "roles"("key");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE UNIQUE INDEX "categories_key_key" ON "categories"("key");

-- CreateIndex
CREATE INDEX "incidents_category_id_idx" ON "incidents"("category_id");

-- CreateIndex
CREATE INDEX "incidents_geozone_id_idx" ON "incidents"("geozone_id");

-- CreateIndex
CREATE INDEX "incidents_organization_id_idx" ON "incidents"("organization_id");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_default_geozone_id_fkey" FOREIGN KEY ("default_geozone_id") REFERENCES "geozones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_category_access" ADD CONSTRAINT "user_category_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_category_access" ADD CONSTRAINT "user_category_access_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_geozone_access" ADD CONSTRAINT "user_geozone_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_geozone_access" ADD CONSTRAINT "user_geozone_access_geozone_id_fkey" FOREIGN KEY ("geozone_id") REFERENCES "geozones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_map_layer_access" ADD CONSTRAINT "user_map_layer_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_analytics_access" ADD CONSTRAINT "user_analytics_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_geozone_id_fkey" FOREIGN KEY ("geozone_id") REFERENCES "geozones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
