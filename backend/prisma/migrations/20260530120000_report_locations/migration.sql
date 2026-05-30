-- Per-report coordinates for incident aggregation (centroid on map pin)
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

UPDATE incident_reports r
SET
  lat = i.lat,
  lng = i.lng,
  title = COALESCE(r.title, i.title),
  address = COALESCE(r.address, i.address)
FROM incidents i
WHERE r.incident_id = i.id
  AND (r.lat IS NULL OR r.lng IS NULL);

UPDATE incident_reports
SET title = LEFT(message, 120)
WHERE title IS NULL OR title = '';

ALTER TABLE incident_reports ALTER COLUMN title SET NOT NULL;
ALTER TABLE incident_reports ALTER COLUMN lat SET NOT NULL;
ALTER TABLE incident_reports ALTER COLUMN lng SET NOT NULL;

UPDATE incident_reports r
SET location = ST_SetSRID(ST_MakePoint(r.lng, r.lat), 4326)::geography
WHERE location IS NULL AND r.lat IS NOT NULL AND r.lng IS NOT NULL;

CREATE OR REPLACE FUNCTION sync_incident_report_location()
RETURNS TRIGGER AS $$
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
