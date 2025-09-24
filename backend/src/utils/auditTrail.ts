import type { Request } from 'express';
import { type AuditLogEventInput } from '../services/auditLogService';
import { extractClientIp, submitAuditEvent } from './audit';

export type AuditEventDetails = Pick<AuditLogEventInput, 'action' | 'resourceType' | 'resourceId' | 'outcome' | 'data' | 'occurredAt'>;

export type AuditActorOverrides = Pick<AuditLogEventInput, 'actorId' | 'actorRole' | 'actorIp' | 'userAgent' | 'requestId'>;

export async function recordAuditEvent(
  req: Request,
  details: AuditEventDetails,
  overrides: AuditActorOverrides = {},
): Promise<void> {
  await submitAuditEvent(req, {
    action: details.action,
    resourceType: details.resourceType,
    resourceId: details.resourceId ?? null,
    outcome: details.outcome ?? null,
    data: details.data ?? null,
    occurredAt: details.occurredAt ?? new Date(),
    actorId: overrides.actorId,
    actorRole: overrides.actorRole,
    actorIp: overrides.actorIp,
    userAgent: overrides.userAgent,
    requestId: overrides.requestId,
  });
}

export function getAuditActorIp(req: Request): string | null {
  return extractClientIp(req);
}
