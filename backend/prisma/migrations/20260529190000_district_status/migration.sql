-- District boundary status for incidents (within / outside Narimanov geozone)
CREATE TYPE "DistrictStatus" AS ENUM ('WITHIN_DISTRICT', 'OUTSIDE_DISTRICT');

ALTER TABLE "incidents"
ADD COLUMN "district_status" "DistrictStatus" NOT NULL DEFAULT 'WITHIN_DISTRICT';

CREATE INDEX "incidents_district_status_idx" ON "incidents"("district_status");
