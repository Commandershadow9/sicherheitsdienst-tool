-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('REGULAR', 'NIGHT', 'WEEKEND', 'HOLIDAY', 'EMERGENCY', 'SPECIAL');

-- CreateTable: ShiftTemplate
CREATE TABLE "shift_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "shift_type" "ShiftType" NOT NULL DEFAULT 'REGULAR',
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "duration" INTEGER,
    "required_staff" INTEGER NOT NULL DEFAULT 1,
    "required_qualifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "shift_model_type" TEXT,
    "night_shift" BOOLEAN NOT NULL DEFAULT false,
    "weekend_shift" BOOLEAN NOT NULL DEFAULT false,
    "holiday_shift" BOOLEAN NOT NULL DEFAULT false,
    "wage_multiplier" DECIMAL(4,2) DEFAULT 1.0,
    "color" TEXT DEFAULT '#3B82F6',
    "applicable_days" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable: EmployeeShiftPreference
CREATE TABLE "employee_shift_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "site_id" TEXT,
    "shift_type_preferences" JSONB DEFAULT '{}',
    "time_slot_preferences" JSONB DEFAULT '{}',
    "weekday_preferences" JSONB DEFAULT '{}',
    "blackout_periods" JSONB DEFAULT '[]',
    "max_preferred_shift_length" INTEGER DEFAULT 8,
    "min_preferred_shift_length" INTEGER DEFAULT 6,
    "preferred_consecutive_days" INTEGER DEFAULT 5,
    "preferred_rest_days" INTEGER DEFAULT 2,
    "available_for_replacement" BOOLEAN NOT NULL DEFAULT true,
    "replacement_priority" INTEGER NOT NULL DEFAULT 5,
    "flexibility_score" INTEGER DEFAULT 50,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_shift_preferences_pkey" PRIMARY KEY ("id")
);

-- AlterTable: sites
ALTER TABLE "sites"
ADD COLUMN "default_shift_template_id" TEXT,
ADD COLUMN "min_staff_requirement" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "max_staff_capacity" INTEGER,
ADD COLUMN "critical_hours" JSONB,
ADD COLUMN "auto_generate_shifts" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "shift_templates_type_idx" ON "shift_templates"("shift_type");
CREATE INDEX "shift_templates_active_idx" ON "shift_templates"("is_active");

-- CreateIndex
CREATE INDEX "employee_shift_preferences_user_idx" ON "employee_shift_preferences"("user_id");
CREATE INDEX "employee_shift_preferences_site_idx" ON "employee_shift_preferences"("site_id");
CREATE INDEX "employee_shift_preferences_replacement_idx" ON "employee_shift_preferences"("available_for_replacement");
CREATE UNIQUE INDEX "employee_shift_preferences_user_site_key" ON "employee_shift_preferences"("user_id", "site_id");

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_default_shift_template_id_fkey" FOREIGN KEY ("default_shift_template_id") REFERENCES "shift_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_shift_preferences" ADD CONSTRAINT "employee_shift_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_shift_preferences" ADD CONSTRAINT "employee_shift_preferences_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
