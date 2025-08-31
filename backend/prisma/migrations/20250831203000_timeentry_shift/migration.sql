ALTER TABLE "time_entries" ADD COLUMN IF NOT EXISTS "shiftId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'time_entries_shiftId_fkey'
  ) THEN
    ALTER TABLE "time_entries"
      ADD CONSTRAINT "time_entries_shiftId_fkey"
      FOREIGN KEY ("shiftId") REFERENCES "shifts"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "time_entries_shiftId_idx" ON "time_entries"("shiftId");

