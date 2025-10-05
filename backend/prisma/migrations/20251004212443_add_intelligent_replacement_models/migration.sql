-- DropForeignKey
ALTER TABLE "absences" DROP CONSTRAINT "absences_user_id_fkey";

-- DropForeignKey
ALTER TABLE "device_tokens" DROP CONSTRAINT "device_tokens_user_fkey";

-- DropForeignKey
ALTER TABLE "employee_documents" DROP CONSTRAINT "employee_documents_profile_id_fkey";

-- DropForeignKey
ALTER TABLE "employee_profiles" DROP CONSTRAINT "employee_profiles_user_id_fkey";

-- DropForeignKey
ALTER TABLE "employee_qualifications" DROP CONSTRAINT "employee_qualifications_profile_id_fkey";

-- DropIndex
DROP INDEX "shifts_siteId_idx";

-- DropIndex
DROP INDEX "time_entries_shiftId_idx";

-- AlterTable
ALTER TABLE "absence_documents" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "absences" ALTER COLUMN "starts_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "ends_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "device_tokens" ALTER COLUMN "lastUsedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "employee_documents" ALTER COLUMN "issued_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "expires_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "employee_profiles" ADD COLUMN     "auto_accept_replacement" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "contract_type" TEXT NOT NULL DEFAULT 'FULL_TIME',
ADD COLUMN     "target_weekly_hours" DOUBLE PRECISION NOT NULL DEFAULT 40,
ALTER COLUMN "birth_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "employment_start" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "employment_end" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "employee_qualifications" ALTER COLUMN "valid_from" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "valid_until" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "events" ALTER COLUMN "startTime" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "endTime" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "assignedEmployeeIds" DROP DEFAULT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "object_clearances" ALTER COLUMN "trained_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "valid_until" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "sites" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "employee_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "prefers_night_shifts" BOOLEAN NOT NULL DEFAULT false,
    "prefers_day_shifts" BOOLEAN NOT NULL DEFAULT true,
    "prefers_weekends" BOOLEAN NOT NULL DEFAULT false,
    "target_monthly_hours" INTEGER NOT NULL DEFAULT 160,
    "min_monthly_hours" INTEGER NOT NULL DEFAULT 120,
    "max_monthly_hours" INTEGER NOT NULL DEFAULT 200,
    "flexible_hours" BOOLEAN NOT NULL DEFAULT true,
    "prefers_long_shifts" BOOLEAN NOT NULL DEFAULT false,
    "prefers_short_shifts" BOOLEAN NOT NULL DEFAULT false,
    "prefers_consecutive_days" INTEGER DEFAULT 5,
    "min_rest_days_per_week" INTEGER NOT NULL DEFAULT 2,
    "preferred_site_ids" TEXT[],
    "avoided_site_ids" TEXT[],
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_workloads" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "total_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scheduled_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "night_shift_count" INTEGER NOT NULL DEFAULT 0,
    "weekend_shift_count" INTEGER NOT NULL DEFAULT 0,
    "consecutive_days_worked" INTEGER NOT NULL DEFAULT 0,
    "rest_days_count" INTEGER NOT NULL DEFAULT 0,
    "max_weekly_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "min_rest_hours_between_shifts" DOUBLE PRECISION DEFAULT 11,
    "fairness_score" INTEGER,
    "last_calculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_workloads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_violations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "shift_id" TEXT,
    "violation_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "threshold" DOUBLE PRECISION,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "resolved_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_violations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_preferences_user_id_key" ON "employee_preferences"("user_id");

-- CreateIndex
CREATE INDEX "employee_preferences_user_idx" ON "employee_preferences"("user_id");

-- CreateIndex
CREATE INDEX "employee_workloads_user_period_idx" ON "employee_workloads"("user_id", "year", "month");

-- CreateIndex
CREATE INDEX "employee_workloads_period_idx" ON "employee_workloads"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "employee_workloads_user_id_month_year_key" ON "employee_workloads"("user_id", "month", "year");

-- CreateIndex
CREATE INDEX "compliance_violations_user_created_idx" ON "compliance_violations"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "compliance_violations_type_severity_idx" ON "compliance_violations"("violation_type", "severity");

-- CreateIndex
CREATE INDEX "shift_assignments_shift_idx" ON "shift_assignments"("shiftId");

-- CreateIndex
CREATE INDEX "shifts_startTime_idx" ON "shifts"("startTime");

-- CreateIndex
CREATE INDEX "shifts_status_idx" ON "shifts"("status");

-- CreateIndex
CREATE INDEX "shifts_site_start_idx" ON "shifts"("siteId", "startTime");

-- CreateIndex
CREATE INDEX "sites_name_idx" ON "sites"("name");

-- CreateIndex
CREATE INDEX "sites_city_idx" ON "sites"("city");

-- CreateIndex
CREATE INDEX "sites_postal_idx" ON "sites"("postalCode");

-- CreateIndex
CREATE INDEX "time_entries_user_start_idx" ON "time_entries"("userId", "startTime");

-- CreateIndex
CREATE INDEX "users_name_idx" ON "users"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- AddForeignKey
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_qualifications" ADD CONSTRAINT "employee_qualifications_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_preferences" ADD CONSTRAINT "employee_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_workloads" ADD CONSTRAINT "employee_workloads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_violations" ADD CONSTRAINT "compliance_violations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_violations" ADD CONSTRAINT "compliance_violations_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absences" ADD CONSTRAINT "absences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "object_clearances_user_site_key" RENAME TO "object_clearances_user_id_site_id_key";
