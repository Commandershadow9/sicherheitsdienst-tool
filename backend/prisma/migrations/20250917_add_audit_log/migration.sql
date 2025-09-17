CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "actorRole" TEXT,
    "actorIp" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "data" JSONB,
    "requestId" TEXT,
    "userAgent" TEXT,
    "outcome" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_occurredAt_idx" ON "audit_logs"("occurredAt");
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resourceType", "resourceId");
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs"("actorId", "occurredAt");
