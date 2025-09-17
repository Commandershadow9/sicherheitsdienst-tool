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

function recordAttempt(group: CounterGroup): string {
  const ts = nowIso();
  group.attempts += 1;
  group.lastAttemptAt = ts;
  return ts;
}

function recordSuccess(group: CounterGroup, increment = 1): void {
  const ts = recordAttempt(group);
  group.success += Math.max(0, increment);
  group.lastSuccessAt = ts;
  group.lastError = undefined;
}

function recordFailure(group: CounterGroup, error?: unknown): void {
  const ts = recordAttempt(group);
  group.fail += 1;
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

export function incrPushFail(error?: unknown): void {
  recordFailure(counters.push, error);
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
