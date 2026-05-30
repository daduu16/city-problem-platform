/*
  Warnings:

  - You are about to drop the column `location` on the `incident_reports` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "incident_reports_location_idx";

-- AlterTable
ALTER TABLE "incident_reports" DROP COLUMN "location";

-- CreateIndex
CREATE INDEX "incident_reports_lat_lng_idx" ON "incident_reports"("lat", "lng");
