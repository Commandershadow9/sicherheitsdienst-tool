import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import logger from '../utils/logger';

export type AuditLogEventInput = {
  action: string;
  resourceType: string;
  resourceId?: string | null;
  actorId?: string | null;
  actorRole?: string | null;
  actorIp?: string | null;
  requestId?: string | null;
  userAgent?: string | null;
  outcome?: string | null;
  data?: Record<string, unknown> | null;
  occurredAt?: Date;
};

type AuditLogPayload = Prisma.AuditLogCreateManyInput;

const DEFAULT_FLUSH_INTERVAL_MS = 2000;
const DEFAULT_BATCH_SIZE = 25;
const DEFAULT_MAX_QUEUE = 1000;

const flushIntervalMs = normalizeNumber(process.env.AUDIT_LOG_FLUSH_INTERVAL_MS, DEFAULT_FLUSH_INTERVAL_MS, 100);
const batchSize = normalizeNumber(process.env.AUDIT_LOG_BATCH_SIZE, DEFAULT_BATCH_SIZE, 1);
const maxQueueSize = normalizeNumber(process.env.AUDIT_LOG_MAX_QUEUE, DEFAULT_MAX_QUEUE, 1);

const pendingQueue: AuditLogPayload[] = [];
let flushTimer: NodeJS.Timeout | null = null;
let isFlushing = false;

function normalizeNumber(raw: string | undefined, fallback: number, min: number): number {
  const parsed = raw ? parseInt(raw, 10) : NaN;
  if (Number.isFinite(parsed) && parsed >= min) {
    return parsed;
  }
  return fallback;
}

function toPayload(event: AuditLogEventInput): AuditLogPayload {
  const payload: AuditLogPayload = {
    action: event.action,
    resourceType: event.resourceType,
    resourceId: event.resourceId ?? null,
    actorId: event.actorId ?? null,
    actorRole: event.actorRole ?? null,
    actorIp: event.actorIp ?? null,
    requestId: event.requestId ?? null,
    userAgent: event.userAgent ?? null,
    outcome: event.outcome ?? null,
    occurredAt: event.occurredAt ?? new Date(),
  };

  if (event.data !== undefined) {
    payload.data = event.data === null ? Prisma.DbNull : (event.data as Prisma.InputJsonValue);
  }

  return payload;
}

function scheduleFlush() {
  if (flushTimer || pendingQueue.length === 0) {
    return;
  }

  flushTimer = setTimeout(async () => {
    flushTimer = null;
    try {
      await flushAuditLogQueue();
    } catch (error) {
      logger.error('Scheduled audit log flush failed: %o', error);
    }
  }, flushIntervalMs);

  if (typeof flushTimer.unref === 'function') {
    flushTimer.unref();
  }
}

function enqueue(payload: AuditLogPayload) {
  if (pendingQueue.length >= maxQueueSize) {
    pendingQueue.shift();
    logger.warn('Audit log queue reached capacity (%d); discarding oldest entry.', maxQueueSize);
  }
  pendingQueue.push(payload);
  scheduleFlush();
}

export function getAuditLogQueueSize(): number {
  return pendingQueue.length;
}

export async function logAuditEvent(event: AuditLogEventInput): Promise<boolean> {
  const payload = toPayload(event);
  try {
    await prisma.auditLog.create({ data: payload });
    return true;
  } catch (error) {
    logger.error('Immediate audit log write failed, queueing for retry: %o', error);
    enqueue(payload);
    return false;
  }
}

export async function flushAuditLogQueue(): Promise<number> {
  if (pendingQueue.length === 0 || isFlushing) {
    return 0;
  }

  isFlushing = true;
  const batch = pendingQueue.splice(0, Math.min(batchSize, pendingQueue.length));

  try {
    const result = await prisma.auditLog.createMany({ data: batch });
    isFlushing = false;
    if (pendingQueue.length > 0) {
      scheduleFlush();
    }
    return result.count;
  } catch (error) {
    pendingQueue.unshift(...batch);
    isFlushing = false;
    scheduleFlush();
    logger.error('Batch audit log write failed; will retry later: %o', error);
    return 0;
  }
}

export async function shutdownAuditLogQueue(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  await flushAuditLogQueue();
}

export function __resetAuditLogService(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  pendingQueue.length = 0;
  isFlushing = false;
}
