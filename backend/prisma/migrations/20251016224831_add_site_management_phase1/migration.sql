-- CreateEnum
CREATE TYPE "SiteStatus" AS ENUM ('INQUIRY', 'IN_REVIEW', 'CALCULATING', 'OFFER_SENT', 'ACTIVE', 'INACTIVE', 'LOST');

-- CreateEnum
CREATE TYPE "ImageCategory" AS ENUM ('EXTERIOR', 'INTERIOR', 'FLOOR_PLAN', 'EQUIPMENT', 'EMERGENCY', 'OTHER');

-- CreateEnum
CREATE TYPE "SiteRole" AS ENUM ('OBJEKTLEITER', 'SCHICHTLEITER', 'MITARBEITER');

-- AlterEnum
ALTER TYPE "ClearanceStatus" ADD VALUE 'TRAINING';

-- AlterTable
ALTER TABLE "absence_documents" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "object_clearances" ADD COLUMN     "approved_by" TEXT,
ADD COLUMN     "training_completed_at" TIMESTAMP(3),
ADD COLUMN     "training_hours" INTEGER DEFAULT 0,
ALTER COLUMN "trained_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "valid_until" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "sites" ADD COLUMN     "customerCompany" TEXT,
ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "emergencyContacts" JSONB,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "requiredQualifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "requiredStaff" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "status" "SiteStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "site_images" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "category" "ImageCategory" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaded_by" TEXT NOT NULL,

    CONSTRAINT "site_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_assignments" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "SiteRole" NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT NOT NULL,

    CONSTRAINT "site_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "site_images_site_id_category_idx" ON "site_images"("site_id", "category");

-- CreateIndex
CREATE INDEX "site_assignments_user_id_idx" ON "site_assignments"("user_id");

-- CreateIndex
CREATE INDEX "site_assignments_site_id_role_idx" ON "site_assignments"("site_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "site_assignments_site_id_user_id_key" ON "site_assignments"("site_id", "user_id");

-- CreateIndex
CREATE INDEX "sites_status_idx" ON "sites"("status");

-- AddForeignKey
ALTER TABLE "object_clearances" ADD CONSTRAINT "object_clearances_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_images" ADD CONSTRAINT "site_images_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_images" ADD CONSTRAINT "site_images_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_assignments" ADD CONSTRAINT "site_assignments_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_assignments" ADD CONSTRAINT "site_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "object_clearances_user_site_key" RENAME TO "object_clearances_user_id_site_id_key";
