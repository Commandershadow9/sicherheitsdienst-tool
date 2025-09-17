export type QueueState = {
  name: string;
  pending: number;
  inFlight: number;
  processed: number;
  failed: number;
  lastEnqueuedAt?: string;
  lastStartedAt?: string;
  lastProcessedAt?: string;
  lastFailedAt?: string;
  lastSettledAt?: string;
  lastError?: string;
};

const queues = new Map<string, QueueState>();

function ensureQueue(name: string): QueueState {
  let queue = queues.get(name);
  if (!queue) {
    queue = {
      name,
      pending: 0,
      inFlight: 0,
      processed: 0,
      failed: 0,
    };
    queues.set(name, queue);
  }
  return queue;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function queueJobEnqueued(name: string): void {
  const queue = ensureQueue(name);
  queue.pending += 1;
  queue.lastEnqueuedAt = nowIso();
}

export function queueJobStarted(name: string): void {
  const queue = ensureQueue(name);
  if (queue.pending > 0) {
    queue.pending -= 1;
  }
  queue.inFlight += 1;
  queue.lastStartedAt = nowIso();
}

export function queueJobSucceeded(name: string): void {
  const queue = ensureQueue(name);
  if (queue.inFlight > 0) {
    queue.inFlight -= 1;
  }
  queue.processed += 1;
  const ts = nowIso();
  queue.lastProcessedAt = ts;
  queue.lastSettledAt = ts;
  queue.lastError = undefined;
}

export function queueJobFailed(name: string, error?: unknown): void {
  const queue = ensureQueue(name);
  if (queue.inFlight > 0) {
    queue.inFlight -= 1;
  }
  queue.failed += 1;
  const ts = nowIso();
  queue.lastFailedAt = ts;
  queue.lastSettledAt = ts;
  if (error) {
    if (error instanceof Error) {
      queue.lastError = error.message;
    } else {
      queue.lastError = String(error);
    }
  }
}

export function getQueueSnapshot(): Record<string, QueueState> {
  const snapshot: Record<string, QueueState> = {};
  for (const [name, queue] of queues.entries()) {
    snapshot[name] = { ...queue };
  }
  return snapshot;
}

export function resetQueue(name: string): void {
  queues.delete(name);
}

export function resetAllQueues(): void {
  queues.clear();
}
