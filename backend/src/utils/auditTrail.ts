import type { Request } from 'express';
import logger from './logger';
import { logAuditEvent, type AuditLogEventInput } from '../services/auditLogService';

export type AuditEventDetails = Pick<AuditLogEventInput, 'action' | 'resourceType' | 'resourceId' | 'outcome' | 'data' | 'occurredAt'>;

export type AuditActorOverrides = Pick<AuditLogEventInput, 'actorId' | 'actorRole' | 'actorIp' | 'userAgent' | 'requestId'>;

function extractClientIp(req: Request): string | null {
  const headerCandidates: Array<string | string[] | undefined> = [
    req.headers['x-forwarded-for'],
    req.headers['x-real-ip'],
    req.headers['cf-connecting-ip'],
  ];

  for (const header of headerCandidates) {
    if (!header) {
      continue;
    }
    if (Array.isArray(header)) {
      const value = header.find((entry) => entry && entry.trim().length > 0);
      if (value) {
        return value.split(',')[0]?.trim() || null;
      }
      continue;
    }
    if (typeof header === 'string' && header.trim().length > 0) {
      return header.split(',')[0]?.trim() || null;
    }
  }

  if (typeof req.ip === 'string' && req.ip.length > 0) {
    return req.ip;
  }

  const socketIp = req.socket?.remoteAddress;
  return typeof socketIp === 'string' && socketIp.length > 0 ? socketIp : null;
}

export async function recordAuditEvent(
  req: Request,
  details: AuditEventDetails,
  overrides: AuditActorOverrides = {},
): Promise<void> {
  const event: AuditLogEventInput = {
    action: details.action,
    resourceType: details.resourceType,
    resourceId: details.resourceId ?? null,
    outcome: details.outcome ?? null,
    data: details.data ?? null,
    occurredAt: details.occurredAt ?? new Date(),
    actorId: overrides.actorId ?? req.user?.id ?? null,
    actorRole: overrides.actorRole ?? req.user?.role ?? null,
    actorIp: overrides.actorIp ?? extractClientIp(req),
    requestId: overrides.requestId ?? req.id ?? (typeof req.headers['x-request-id'] === 'string' ? req.headers['x-request-id'] : null),
    userAgent:
      overrides.userAgent ??
      (typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null),
  };

  try {
    await logAuditEvent(event);
  } catch (error) {
    logger.warn('Failed to record audit event: %o', error);
  }
}

export function getAuditActorIp(req: Request): string | null {
  return extractClientIp(req);
}
