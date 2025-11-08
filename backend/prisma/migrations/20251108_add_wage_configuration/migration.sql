-- AlterTable
-- Add wage configuration fields to User model
ALTER TABLE "users" ADD COLUMN "wageGroup" TEXT,
ADD COLUMN "baseWageOverride" DECIMAL(6,2),
ADD COLUMN "activityWages" JSONB;

-- AlterTable
-- Add wage configuration field to Site model
ALTER TABLE "sites" ADD COLUMN "siteWageOverride" DECIMAL(6,2);

-- Add comments for documentation
COMMENT ON COLUMN "users"."wageGroup" IS 'BSDW Tarifgruppe (GRUPPE_1 bis GRUPPE_7)';
COMMENT ON COLUMN "users"."baseWageOverride" IS 'Individueller Stundenlohn in EUR (übersteuert Tarifvertrag)';
COMMENT ON COLUMN "users"."activityWages" IS 'Tätigkeits-spezifische Stundenlöhne als JSON: {"VERANSTALTUNG": 17.00, "BEWAFFNET": 22.00}';
COMMENT ON COLUMN "sites"."siteWageOverride" IS 'Objekt-spezifischer Stundenlohn in EUR (höchste Priorität, übersteuert alle anderen Werte)';
