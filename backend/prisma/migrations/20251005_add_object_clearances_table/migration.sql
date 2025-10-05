-- Objekt-Einarbeitungen (Clearances) nachziehen
CREATE TYPE "ClearanceStatus" AS ENUM ('ACTIVE','EXPIRED','REVOKED');

CREATE TABLE "object_clearances" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "site_id" TEXT NOT NULL,
  "trained_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "trained_by" TEXT,
  "valid_until" TIMESTAMP,
  "notes" TEXT,
  "status" "ClearanceStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE "object_clearances"
  ADD CONSTRAINT "object_clearances_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "object_clearances"
  ADD CONSTRAINT "object_clearances_site_id_fkey"
  FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "object_clearances"
  ADD CONSTRAINT "object_clearances_trained_by_fkey"
  FOREIGN KEY ("trained_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "object_clearances_user_site_key" ON "object_clearances"("user_id", "site_id");
CREATE INDEX "object_clearances_user_idx" ON "object_clearances"("user_id");
CREATE INDEX "object_clearances_site_idx" ON "object_clearances"("site_id");
CREATE INDEX "object_clearances_status_idx" ON "object_clearances"("status");
CREATE INDEX "object_clearances_valid_idx" ON "object_clearances"("valid_until");

CREATE TRIGGER object_clearances_updated_at
BEFORE UPDATE ON "object_clearances"
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
