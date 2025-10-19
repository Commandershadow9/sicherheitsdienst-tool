-- CreateEnum
CREATE TYPE "IncidentHistoryAction" AS ENUM ('CREATED', 'UPDATED', 'RESOLVED', 'STATUS_CHANGED', 'DELETED');

-- CreateTable
CREATE TABLE "incident_history" (
    "id" TEXT NOT NULL,
    "incident_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" "IncidentHistoryAction" NOT NULL,
    "changes" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "incident_history_incident_id_created_at_idx" ON "incident_history"("incident_id", "created_at");

-- AddForeignKey
ALTER TABLE "incident_history" ADD CONSTRAINT "incident_history_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "site_incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_history" ADD CONSTRAINT "incident_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE CASCADE;
