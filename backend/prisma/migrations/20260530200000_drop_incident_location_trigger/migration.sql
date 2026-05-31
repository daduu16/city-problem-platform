-- incidents.location was dropped in 20260529233802_test but the sync trigger remained.
-- INSERT then failed with Prisma P2022: column `new` (broken trigger referencing NEW.location).

DROP TRIGGER IF EXISTS incident_location_sync ON incidents;
DROP FUNCTION IF EXISTS sync_incident_location();
