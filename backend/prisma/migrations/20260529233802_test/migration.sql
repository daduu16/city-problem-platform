/*
  Warnings:

  - You are about to drop the column `location` on the `incidents` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "incidents_location_idx";

-- AlterTable
ALTER TABLE "incidents" DROP COLUMN "location";
