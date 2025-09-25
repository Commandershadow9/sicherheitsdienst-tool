-- Create Enum for EventStatus
DO $$ BEGIN
  CREATE TYPE "EventStatus" AS ENUM ('PLANNED','ACTIVE','DONE','CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create Table events
CREATE TABLE IF NOT EXISTS "events" (
  "id"            TEXT PRIMARY KEY,
  "title"         TEXT NOT NULL,
  "description"   TEXT,
  "siteId"        TEXT,
  "startTime"     TIMESTAMPTZ NOT NULL,
  "endTime"       TIMESTAMPTZ NOT NULL,
  "serviceInstructions" TEXT NOT NULL,
  "assignedEmployeeIds" TEXT[] NOT NULL DEFAULT '{}',
  "status"        "EventStatus" NOT NULL DEFAULT 'PLANNED',
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK constraint (idempotent, Postgres-kompatibel)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_siteId_fkey'
  ) THEN
    ALTER TABLE "events"
      ADD CONSTRAINT "events_siteId_fkey"
      FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "events_start_idx" ON "events" ("startTime");
CREATE INDEX IF NOT EXISTS "events_site_start_idx" ON "events" ("siteId", "startTime");

-- Trigger to update updatedAt (if not already managed by app)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_on_events ON "events";
CREATE TRIGGER set_updated_at_on_events
BEFORE UPDATE ON "events"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
