import client from 'prom-client';

export const auditLogEventCounter = new client.Counter({
  name: 'audit_log_events_total',
  help: 'Audit log events processed by result path',
  labelNames: ['result'] as const,
});

export const auditLogQueueGauge = new client.Gauge({
  name: 'audit_log_queue_size',
  help: 'Current size of the audit log retry queue',
});

export const auditLogFailureCounter = new client.Counter({
  name: 'audit_log_failures_total',
  help: 'Audit log failures grouped by stage',
  labelNames: ['stage'] as const,
});

export const auditLogPruneCounter = new client.Counter({
  name: 'audit_log_prune_operations_total',
  help: 'Audit log prune operations grouped by result',
  labelNames: ['result'] as const,
});

export function setQueueSize(value: number): void {
  auditLogQueueGauge.set(Math.max(0, value));
}

