-- Create sites table
CREATE TABLE IF NOT EXISTS "sites" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "postalCode" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Unique composite constraint to avoid duplicate sites
CREATE UNIQUE INDEX IF NOT EXISTS "sites_name_address_city_postalCode_key"
ON "sites" ("name","address","city","postalCode");

-- Add optional siteId column to shifts
ALTER TABLE "shifts" ADD COLUMN IF NOT EXISTS "siteId" TEXT;

-- Add FK constraint (on delete set null to keep shifts)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'shifts_siteId_fkey'
  ) THEN
    ALTER TABLE "shifts"
      ADD CONSTRAINT "shifts_siteId_fkey"
      FOREIGN KEY ("siteId") REFERENCES "sites"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END
$$;

-- Optional index for faster lookup by siteId
CREATE INDEX IF NOT EXISTS "shifts_siteId_idx" ON "shifts"("siteId");

