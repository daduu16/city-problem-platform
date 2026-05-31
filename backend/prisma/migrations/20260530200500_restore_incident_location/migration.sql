-- Keep PostGIS location in sync with Prisma lat/lng fields.
-- A later migration dropped the raw SQL-only column while leaving the trigger behind.
CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE incidents ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

UPDATE incidents
SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
WHERE location IS NULL;

CREATE OR REPLACE FUNCTION sync_incident_location()
RETURNS trigger AS $$
BEGIN
  NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS incident_location_sync ON incidents;
CREATE TRIGGER incident_location_sync
  BEFORE INSERT OR UPDATE OF lat, lng ON incidents
  FOR EACH ROW EXECUTE FUNCTION sync_incident_location();

CREATE INDEX IF NOT EXISTS incidents_location_idx ON incidents USING GIST (location);
