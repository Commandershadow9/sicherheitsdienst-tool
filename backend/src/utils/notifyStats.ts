type CounterGroup = { success: number; fail: number };

const counters: { email: CounterGroup; push: CounterGroup } = {
  email: { success: 0, fail: 0 },
  push: { success: 0, fail: 0 },
};

export function incrEmailSuccess() { counters.email.success++; }
export function incrEmailFail() { counters.email.fail++; }
export function incrPushSuccess(n: number) { counters.push.success += Math.max(0, n | 0); }
export function incrPushFail() { counters.push.fail++; }

export function getNotifyCounters() {
  return { email: { ...counters.email }, push: { ...counters.push } };
}

