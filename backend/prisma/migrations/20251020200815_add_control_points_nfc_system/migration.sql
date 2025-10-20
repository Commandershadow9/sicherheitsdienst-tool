-- CreateEnum
CREATE TYPE "ControlRoundStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'INCOMPLETE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScanMethod" AS ENUM ('NFC', 'QR_CODE', 'MANUAL');

-- DropForeignKey
ALTER TABLE "incident_history" DROP CONSTRAINT "incident_history_user_id_fkey";

-- DropForeignKey
ALTER TABLE "site_incidents" DROP CONSTRAINT "site_incidents_reported_by_fkey";

-- AlterTable
ALTER TABLE "site_incidents" ADD COLUMN     "shift_id" TEXT;

-- CreateTable
CREATE TABLE "control_points" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "instructions" TEXT,
    "nfcTagId" TEXT,
    "qrCode" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "control_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control_rounds" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "shiftId" TEXT,
    "performedBy" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "ControlRoundStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "scannedPoints" INTEGER NOT NULL DEFAULT 0,
    "missedPoints" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "control_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control_scans" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "pointId" TEXT NOT NULL,
    "scannedBy" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scanMethod" "ScanMethod" NOT NULL,
    "tagIdentifier" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "notes" TEXT,
    "hasIssue" BOOLEAN NOT NULL DEFAULT false,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "validationError" TEXT,

    CONSTRAINT "control_scans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "control_points_nfcTagId_key" ON "control_points"("nfcTagId");

-- CreateIndex
CREATE UNIQUE INDEX "control_points_qrCode_key" ON "control_points"("qrCode");

-- CreateIndex
CREATE INDEX "control_points_site_order_idx" ON "control_points"("siteId", "order");

-- CreateIndex
CREATE INDEX "control_points_site_active_idx" ON "control_points"("siteId", "isActive");

-- CreateIndex
CREATE INDEX "control_rounds_site_start_idx" ON "control_rounds"("siteId", "startedAt");

-- CreateIndex
CREATE INDEX "control_rounds_performer_status_idx" ON "control_rounds"("performedBy", "status");

-- CreateIndex
CREATE INDEX "control_rounds_shift_idx" ON "control_rounds"("shiftId");

-- CreateIndex
CREATE INDEX "control_scans_round_time_idx" ON "control_scans"("roundId", "scannedAt");

-- CreateIndex
CREATE INDEX "control_scans_point_time_idx" ON "control_scans"("pointId", "scannedAt");

-- CreateIndex
CREATE INDEX "control_scans_scanner_idx" ON "control_scans"("scannedBy");

-- AddForeignKey
ALTER TABLE "site_incidents" ADD CONSTRAINT "site_incidents_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_incidents" ADD CONSTRAINT "site_incidents_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_history" ADD CONSTRAINT "incident_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_points" ADD CONSTRAINT "control_points_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_rounds" ADD CONSTRAINT "control_rounds_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_rounds" ADD CONSTRAINT "control_rounds_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_rounds" ADD CONSTRAINT "control_rounds_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_scans" ADD CONSTRAINT "control_scans_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "control_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_scans" ADD CONSTRAINT "control_scans_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "control_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_scans" ADD CONSTRAINT "control_scans_scannedBy_fkey" FOREIGN KEY ("scannedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
