-- Keep citizen report PostGIS location in sync with Prisma lat/lng fields.
CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

UPDATE incident_reports
SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
WHERE location IS NULL;

CREATE OR REPLACE FUNCTION sync_incident_report_location()
RETURNS trigger AS $$
BEGIN
  NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS incident_report_location_sync ON incident_reports;
CREATE TRIGGER incident_report_location_sync
  BEFORE INSERT OR UPDATE OF lat, lng ON incident_reports
  FOR EACH ROW EXECUTE FUNCTION sync_incident_report_location();

CREATE INDEX IF NOT EXISTS incident_reports_location_idx ON incident_reports USING GIST (location);
