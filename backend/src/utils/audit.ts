import type { Request } from 'express';
import { logAuditEvent, type AuditLogEventInput } from '../services/auditLogService';
import logger from './logger';

export type RequestActor = { id?: string | null; role?: string | null } | undefined;

type BuildableAuditEvent = Omit<AuditLogEventInput, 'actorId' | 'actorRole' | 'actorIp' | 'requestId' | 'userAgent'> &
  Partial<Pick<AuditLogEventInput, 'actorId' | 'actorRole' | 'actorIp' | 'requestId' | 'userAgent'>>;

function normalizeUserAgent(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function getRequestUser(req: Request): RequestActor {
  return (req.user as RequestActor) || undefined;
}

export function extractClientIp(req: Request): string | null {
  const headers = req.headers ?? {};
  const headerCandidates: Array<string | string[] | undefined> = [
    headers['x-forwarded-for'],
    headers['x-real-ip'],
    headers['cf-connecting-ip'],
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

function resolveRequestId(req: Request): string | null {
  const headers = req.headers ?? {};
  if (typeof (req as any).id === 'string' && (req as any).id.length > 0) {
    return (req as any).id;
  }
  const headerId = headers['x-request-id'];
  if (typeof headerId === 'string' && headerId.length > 0) {
    return headerId;
  }
  return null;
}

export function buildAuditEvent(req: Request, event: BuildableAuditEvent): AuditLogEventInput {
  const actor = getRequestUser(req);
  const headers = req.headers ?? {};
  return {
    action: event.action,
    resourceType: event.resourceType,
    resourceId: event.resourceId ?? null,
    actorId: event.actorId ?? actor?.id ?? null,
    actorRole: event.actorRole ?? actor?.role ?? null,
    actorIp: event.actorIp ?? extractClientIp(req),
    requestId: event.requestId ?? resolveRequestId(req),
    userAgent: event.userAgent ?? normalizeUserAgent(headers['user-agent']),
    outcome: event.outcome ?? null,
    data: event.data ?? null,
    occurredAt: event.occurredAt ?? new Date(),
  };
}

export async function submitAuditEvent(req: Request, event: BuildableAuditEvent): Promise<void> {
  try {
    await logAuditEvent(buildAuditEvent(req, event));
  } catch (error) {
    logger.warn('Failed to submit audit event: %o', error);
  }
}

export function getAuditActorIp(req: Request): string | null {
  return extractClientIp(req);
}
