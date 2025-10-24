-- CreateEnum
CREATE TYPE "BuildingType" AS ENUM ('OFFICE', 'INDUSTRIAL', 'RETAIL', 'EVENT', 'CONSTRUCTION', 'OTHER');

-- AlterTable
ALTER TABLE "sites" ADD COLUMN     "buildingType" "BuildingType",
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "floorCount" INTEGER,
ADD COLUMN     "geoLat" DECIMAL(10,8),
ADD COLUMN     "geoLng" DECIMAL(11,8),
ADD COLUMN     "securityConcept" JSONB,
ADD COLUMN     "squareMeters" INTEGER,
ADD COLUMN     "wizardCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "wizardStep" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "industry" TEXT,
    "taxId" TEXT,
    "primaryContact" JSONB NOT NULL,
    "contacts" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Deutschland',
    "billingAddress" JSONB,
    "paymentTerms" TEXT NOT NULL DEFAULT '30 Tage netto',
    "discount" DECIMAL(5,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "buildingType" "BuildingType" NOT NULL,
    "hoursPerWeek" INTEGER NOT NULL,
    "shiftModel" TEXT NOT NULL,
    "requiredStaff" INTEGER NOT NULL,
    "requiredQualifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tasks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "basePrice" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_companyName_key" ON "customers"("companyName");

-- CreateIndex
CREATE UNIQUE INDEX "customers_taxId_key" ON "customers"("taxId");

-- CreateIndex
CREATE INDEX "customers_companyName_idx" ON "customers"("companyName");

-- CreateIndex
CREATE INDEX "sites_customer_idx" ON "sites"("customerId");

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
