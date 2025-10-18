-- CreateEnum
CREATE TYPE "SiteIncidentCategory" AS ENUM ('FIRE', 'BREAK_IN', 'THEFT', 'VANDALISM', 'ACCIDENT', 'MEDICAL_EMERGENCY', 'DISTURBANCE', 'PROPERTY_DAMAGE', 'SUSPICIOUS_PERSON', 'TECHNICAL_FAILURE', 'OTHER');

-- CreateTable
CREATE TABLE "site_incidents" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "SiteIncidentCategory" NOT NULL,
    "severity" "IncidentSeverity" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "reported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT,
    "reported_by" TEXT NOT NULL,
    "involvedPersons" TEXT,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "resolved_at" TIMESTAMP(3),
    "resolution" TEXT,
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "site_incidents_site_id_occurredAt_idx" ON "site_incidents"("site_id", "occurredAt");

-- CreateIndex
CREATE INDEX "site_incidents_site_id_status_idx" ON "site_incidents"("site_id", "status");

-- CreateIndex
CREATE INDEX "site_incidents_site_id_category_idx" ON "site_incidents"("site_id", "category");

-- AddForeignKey
ALTER TABLE "site_incidents" ADD CONSTRAINT "site_incidents_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_incidents" ADD CONSTRAINT "site_incidents_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "users"("id") ON UPDATE CASCADE;
