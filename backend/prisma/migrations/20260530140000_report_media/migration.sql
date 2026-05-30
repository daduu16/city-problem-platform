-- Optional photo and YouTube video URLs on citizen reports
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS video_url TEXT;
