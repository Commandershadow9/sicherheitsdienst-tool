-- CreateEnum
CREATE TYPE "CalculationStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "price_models" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hourlyRateEmployee" DOUBLE PRECISION NOT NULL DEFAULT 13.50,
    "hourlyRateShiftLeader" DOUBLE PRECISION NOT NULL DEFAULT 16.00,
    "hourlyRateSiteManager" DOUBLE PRECISION NOT NULL DEFAULT 18.50,
    "nightSurcharge" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "saturdaySurcharge" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "sundaySurcharge" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "holidaySurcharge" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "nslCertificateSurcharge" DOUBLE PRECISION NOT NULL DEFAULT 1.50,
    "dogHandlerSurcharge" DOUBLE PRECISION NOT NULL DEFAULT 2.50,
    "weaponLicenseSurcharge" DOUBLE PRECISION NOT NULL DEFAULT 2.00,
    "overheadPercentage" DOUBLE PRECISION NOT NULL DEFAULT 12,
    "profitMarginPercentage" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_calculations" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "priceModelId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "CalculationStatus" NOT NULL DEFAULT 'DRAFT',
    "requiredStaff" INTEGER NOT NULL DEFAULT 1,
    "hoursPerWeek" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "contractDurationMonths" INTEGER NOT NULL DEFAULT 12,
    "hoursDay" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "hoursNight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hoursSaturday" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hoursSunday" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hoursHoliday" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "employeeCount" INTEGER NOT NULL DEFAULT 1,
    "shiftLeaderCount" INTEGER NOT NULL DEFAULT 0,
    "siteManagerCount" INTEGER NOT NULL DEFAULT 0,
    "customHourlyRateEmployee" DOUBLE PRECISION,
    "customHourlyRateShiftLeader" DOUBLE PRECISION,
    "customHourlyRateSiteManager" DOUBLE PRECISION,
    "customNightSurcharge" DOUBLE PRECISION,
    "customSaturdaySurcharge" DOUBLE PRECISION,
    "customSundaySurcharge" DOUBLE PRECISION,
    "customHolidaySurcharge" DOUBLE PRECISION,
    "riskSurchargePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "distanceSurcharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "customOverheadPercentage" DOUBLE PRECISION,
    "customProfitMarginPercentage" DOUBLE PRECISION,
    "totalPersonnelCostMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalOverheadMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalProfitMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPriceMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "setupCostUniform" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "setupCostEquipment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "setupCostOther" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "calculatedBy" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "site_calculation_version_idx" ON "site_calculations"("siteId", "version");

-- CreateIndex
CREATE INDEX "site_calculation_status_idx" ON "site_calculations"("status");

-- AddForeignKey
ALTER TABLE "site_calculations" ADD CONSTRAINT "site_calculations_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_calculations" ADD CONSTRAINT "site_calculations_priceModelId_fkey" FOREIGN KEY ("priceModelId") REFERENCES "price_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_calculations" ADD CONSTRAINT "site_calculations_calculatedBy_fkey" FOREIGN KEY ("calculatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
