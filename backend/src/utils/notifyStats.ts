type CounterGroup = {
  success: number;
  fail: number;
  attempts: number;
  lastAttemptAt?: string;
  lastSuccessAt?: string;
  lastFailAt?: string;
  lastError?: string;
};

const counters: { email: CounterGroup; push: CounterGroup } = {
  email: { success: 0, fail: 0, attempts: 0 },
  push: { success: 0, fail: 0, attempts: 0 },
};

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeIncrement(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  return Math.floor(value);
}

function recordAttempt(group: CounterGroup, increment = 1): string {
  const ts = nowIso();
  group.attempts += normalizeIncrement(increment);
  group.lastAttemptAt = ts;
  return ts;
}

function recordSuccess(group: CounterGroup, increment = 1): void {
  const ts = recordAttempt(group);
  group.success += Math.max(0, increment);
  group.lastSuccessAt = ts;
  group.lastError = undefined;
}

function recordFailure(group: CounterGroup, error?: unknown, increment = 1): void {
  const ts = recordAttempt(group, increment);
  group.fail += normalizeIncrement(increment);
  group.lastFailAt = ts;
  if (error) {
    group.lastError = error instanceof Error ? error.message : String(error);
  }
}

export function incrEmailSuccess(): void {
  recordSuccess(counters.email);
}

export function incrEmailFail(error?: unknown): void {
  recordFailure(counters.email, error);
}

export function incrPushSuccess(delivered: number): void {
  recordSuccess(counters.push, delivered);
}

export function incrPushFail(error?: unknown, count = 1): void {
  recordFailure(counters.push, error, count);
}

export function getNotifyCounters() {
  return {
    email: { ...counters.email },
    push: { ...counters.push },
  };
}

export function resetNotifyCounters(): void {
  counters.email = { success: 0, fail: 0, attempts: 0 };
  counters.push = { success: 0, fail: 0, attempts: 0 };
}
