import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import {
  auditLogEventCounter,
  auditLogFailureCounter,
  setQueueSize,
} from '../utils/auditMetrics';

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
let auditModelMissingWarned = false;

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
  setQueueSize(pendingQueue.length);
  scheduleFlush();
}

export function getAuditLogQueueSize(): number {
  return pendingQueue.length;
}

type AuditModel = {
  create: (args: { data: AuditLogPayload }) => Promise<unknown>;
  createMany: (args: { data: AuditLogPayload[] }) => Promise<{ count: number }>;
};

function getAuditModel(): AuditModel | null {
  const model = (prisma as unknown as { auditLog?: AuditModel }).auditLog;
  if (!model || typeof model.create !== 'function' || typeof model.createMany !== 'function') {
    if (!auditModelMissingWarned && process.env.NODE_ENV !== 'test') {
      auditModelMissingWarned = true;
      logger.warn('Audit log model unavailable; dropping audit events.');
    }
    return null;
  }
  return model;
}

export async function logAuditEvent(event: AuditLogEventInput): Promise<boolean> {
  const payload = toPayload(event);
  const auditModel = getAuditModel();
  if (!auditModel) {
    auditLogEventCounter.inc({ result: 'dropped_no_model' });
    return false;
  }
  try {
    await auditModel.create({ data: payload });
    auditLogEventCounter.inc({ result: 'direct_success' });
    return true;
  } catch (error) {
    logger.error('Immediate audit log write failed, queueing for retry: %o', error);
    enqueue(payload);
    auditLogEventCounter.inc({ result: 'direct_failure' });
    auditLogFailureCounter.inc({ stage: 'direct' });
    return false;
  }
}

export async function flushAuditLogQueue(): Promise<number> {
  if (pendingQueue.length === 0 || isFlushing) {
    return 0;
  }

  const auditModel = getAuditModel();
  if (!auditModel) {
    return 0;
  }

  isFlushing = true;
  const batch = pendingQueue.splice(0, Math.min(batchSize, pendingQueue.length));

  try {
    const result = await auditModel.createMany({ data: batch });
    isFlushing = false;
    auditLogEventCounter.inc({ result: 'flush_success' }, result.count);
    if (pendingQueue.length > 0) {
      scheduleFlush();
    }
    setQueueSize(pendingQueue.length);
    return result.count;
  } catch (error) {
    pendingQueue.unshift(...batch);
    isFlushing = false;
    scheduleFlush();
    logger.error('Batch audit log write failed; will retry later: %o', error);
    auditLogEventCounter.inc({ result: 'flush_failure' });
    auditLogFailureCounter.inc({ stage: 'flush' });
    setQueueSize(pendingQueue.length);
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
  auditModelMissingWarned = false;
  setQueueSize(0);
}

export function getAuditLogState() {
  return {
    queueSize: pendingQueue.length,
    flushIntervalMs,
    batchSize,
    maxQueueSize,
    isFlushing,
    hasScheduledFlush: Boolean(flushTimer),
  };
}
