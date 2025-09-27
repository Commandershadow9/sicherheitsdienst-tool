-- Create enums
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME','PART_TIME','MINI_JOB','TEMPORARY','CONTRACTOR');
CREATE TYPE "DocumentCategory" AS ENUM ('FIREARM_LICENSE','WARNING_LETTER','CONTRACT','TRAINING_CERTIFICATE','MEDICAL_CERTIFICATE','OTHER');
CREATE TYPE "AbsenceType" AS ENUM ('VACATION','SICKNESS','SPECIAL_LEAVE','UNPAID');
CREATE TYPE "AbsenceStatus" AS ENUM ('REQUESTED','APPROVED','REJECTED','CANCELLED');

-- Employee profile core table
CREATE TABLE "employee_profiles" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL UNIQUE,
  "address" JSONB,
  "birth_date" TIMESTAMP,
  "phone" TEXT,
  "employment_type" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
  "employment_start" TIMESTAMP,
  "employment_end" TIMESTAMP,
  "work_schedule" TEXT,
  "hourly_rate" DECIMAL(10,2),
  "weekly_target_hours" INTEGER,
  "monthly_target_hours" INTEGER,
  "notes" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Qualifications
CREATE TABLE "employee_qualifications" (
  "id" TEXT PRIMARY KEY,
  "profile_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "valid_from" TIMESTAMP,
  "valid_until" TIMESTAMP
);

-- Documents
CREATE TABLE "employee_documents" (
  "id" TEXT PRIMARY KEY,
  "profile_id" TEXT NOT NULL,
  "category" "DocumentCategory" NOT NULL,
  "filename" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "stored_at" TEXT NOT NULL,
  "issued_at" TIMESTAMP,
  "expires_at" TIMESTAMP,
  "uploaded_by" TEXT NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Absences
CREATE TABLE "absences" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "created_by_id" TEXT NOT NULL,
  "decided_by_id" TEXT,
  "type" "AbsenceType" NOT NULL,
  "status" "AbsenceStatus" NOT NULL DEFAULT 'REQUESTED',
  "starts_at" TIMESTAMP NOT NULL,
  "ends_at" TIMESTAMP NOT NULL,
  "reason" TEXT,
  "decision_note" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Foreign keys
ALTER TABLE "employee_profiles"
  ADD CONSTRAINT "employee_profiles_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "employee_qualifications"
  ADD CONSTRAINT "employee_qualifications_profile_id_fkey"
  FOREIGN KEY ("profile_id") REFERENCES "employee_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "employee_documents"
  ADD CONSTRAINT "employee_documents_profile_id_fkey"
  FOREIGN KEY ("profile_id") REFERENCES "employee_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_documents"
  ADD CONSTRAINT "employee_documents_uploaded_by_fkey"
  FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "absences"
  ADD CONSTRAINT "absences_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "absences_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "absences_decided_by_id_fkey"
  FOREIGN KEY ("decided_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "employee_qualifications_profile_valid_idx" ON "employee_qualifications"("profile_id", "valid_until");
CREATE INDEX "employee_documents_profile_idx" ON "employee_documents"("profile_id");
CREATE INDEX "employee_documents_category_idx" ON "employee_documents"("category");
CREATE INDEX "employee_documents_expires_idx" ON "employee_documents"("expires_at");
CREATE INDEX "absences_status_idx" ON "absences"("status");
CREATE INDEX "absences_type_idx" ON "absences"("type");
CREATE INDEX "absences_start_idx" ON "absences"("starts_at");
CREATE INDEX "absences_user_start_idx" ON "absences"("user_id", "starts_at");

-- Trigger to maintain updated_at for employee_profiles and absences
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employee_profiles_updated_at
BEFORE UPDATE ON "employee_profiles"
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER absences_updated_at
BEFORE UPDATE ON "absences"
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
