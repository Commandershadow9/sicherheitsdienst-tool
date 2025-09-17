const publishNotificationEventMock = jest.fn();

jest.mock('../utils/notificationEvents', () => ({
  publishNotificationEvent: publishNotificationEventMock,
}));

jest.mock('../utils/notifyStats', () => {
  const counters = {
    email: { success: 0, fail: 0, attempts: 0 },
    push: { success: 0, fail: 0, attempts: 0 },
  };

  const clamp = (value: number) => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      return 0;
    }
    return Math.floor(value);
  };

  return {
    incrPushSuccess: (n: number) => {
      const increment = clamp(n);
      counters.push.success += increment;
      counters.push.attempts += 1;
    },
    incrPushFail: (_error?: unknown, count = 1) => {
      const increment = clamp(count);
      counters.push.fail += increment;
      counters.push.attempts += increment;
    },
    __counters: counters,
    __reset: () => {
      counters.email.success = 0;
      counters.email.fail = 0;
      counters.email.attempts = 0;
      counters.push.success = 0;
      counters.push.fail = 0;
      counters.push.attempts = 0;
    },
  };
});

jest.mock('@prisma/client', () => {
  const prisma = { deviceToken: { updateMany: jest.fn(), findMany: jest.fn() } };
  return { PrismaClient: jest.fn(() => prisma) };
});

type NotifyStatsMock = {
  __reset: () => void;
  __counters: {
    email: { success: number; fail: number; attempts: number };
    push: { success: number; fail: number; attempts: number };
  };
};

const getNotifyStatsMock = (): NotifyStatsMock => require('../utils/notifyStats');

describe('pushService', () => {
  beforeEach(() => {
    process.env.FCM_PROJECT_ID = '';
    process.env.FCM_CLIENT_EMAIL = '';
    process.env.FCM_PRIVATE_KEY = '';
    const queueStats = require('../utils/queueStats');
    queueStats.resetAllQueues();
  });

  it('mock path increments success when FCM not configured', async () => {
    const notifyStats = getNotifyStatsMock();
    notifyStats.__reset();
    const svc = require('../services/pushService');
    const pm = new (require('@prisma/client').PrismaClient)();
    pm.deviceToken.findMany.mockResolvedValueOnce([{ token: 't1' }, { token: 't2' }]);
    const res = await svc.sendPushToUsers(['u1'], 'T', 'B');
    expect(res.success).toBe(true);

    const counters = getNotifyStatsMock().__counters;
    expect(counters.push.success).toBe(2);
    expect(counters.push.fail).toBe(0);
    expect(counters.push.attempts).toBe(1);
  });

  it('records failure metrics and resets queue state when token lookup throws', async () => {
    const notifyStats = getNotifyStatsMock();
    notifyStats.__reset();
    const svc = require('../services/pushService');
    const pm = new (require('@prisma/client').PrismaClient)();
    const error = new Error('db kaputt');
    pm.deviceToken.findMany.mockRejectedValueOnce(error);
    const res = await svc.sendPushToUsers(['u1'], 'T', 'B');
    expect(res.success).toBe(false);
    const notify = require('../utils/notifyStats');
    expect(notify.__counters.push.fail).toBe(1);
    expect(notify.__counters.push.success).toBe(0);
    expect(notify.__counters.push.attempts).toBe(1);
    const queue = require('../utils/queueStats');
    const snapshot = queue.getQueueSnapshot();
    expect(snapshot['notifications-push']).toBeDefined();
    expect(snapshot['notifications-push']).toMatchObject({
      pending: 0,
      inFlight: 0,
      processed: 0,
      failed: 1,
      lastError: error.message,
    });
  });

  it('FCM path disables invalid tokens', async () => {
    process.env.FCM_PROJECT_ID = 'p';
    process.env.FCM_CLIENT_EMAIL = 'c';
    process.env.FCM_PRIVATE_KEY = 'k';
    jest.resetModules();
    publishNotificationEventMock.mockReset();
    jest.doMock('@prisma/client', () => {
      const prisma = { deviceToken: { updateMany: jest.fn(), findMany: jest.fn() } };
      return { PrismaClient: jest.fn(() => prisma) };
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).prisma = undefined;
    const adminMock = {
      credential: { cert: jest.fn(() => ({})) },
      initializeApp: jest.fn(),
      messaging: jest.fn(() => ({
        sendEachForMulticast: jest.fn(async () => ({
          failureCount: 1,
          responses: [
            { success: false, error: { code: 'messaging/registration-token-not-registered' } },
            { success: true },
          ],
        })),
      })),
    };
    jest.doMock('firebase-admin', () => adminMock, { virtual: true });
    const notifyStats = getNotifyStatsMock();
    notifyStats.__reset();
    const svc = require('../services/pushService');
    const pm = new (require('@prisma/client').PrismaClient)();
    pm.deviceToken.findMany.mockResolvedValueOnce([{ token: 'bad' }, { token: 'good' }]);
    const res = await svc.sendPushToUsers(['u1'], 'T', 'B');
    expect(res.success).toBe(true);
    expect(pm.deviceToken.updateMany).toHaveBeenCalled();
  });

  it('tracks partial failures with failure counts for success rate', async () => {
    process.env.FCM_PROJECT_ID = 'p';
    process.env.FCM_CLIENT_EMAIL = 'c';
    process.env.FCM_PRIVATE_KEY = 'k';
    jest.resetModules();
    publishNotificationEventMock.mockReset();
    jest.doMock('@prisma/client', () => {
      const prisma = { deviceToken: { updateMany: jest.fn(), findMany: jest.fn() } };
      return { PrismaClient: jest.fn(() => prisma) };
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).prisma = undefined;
    const failureCount = 3;
    const adminMock = {
      credential: { cert: jest.fn(() => ({})) },
      initializeApp: jest.fn(),
      messaging: jest.fn(() => ({
        sendEachForMulticast: jest.fn(async () => ({
          failureCount,
          responses: [
            { success: false, error: { code: 'messaging/registration-token-not-registered' } },
            { success: false, error: { code: 'messaging/invalid-registration-token' } },
            { success: false, error: { code: 'messaging/internal-error' } },
            { success: true },
            { success: true },
          ],
        })),
      })),
    };
    jest.doMock('firebase-admin', () => adminMock, { virtual: true });
    const notifyStats = getNotifyStatsMock();
    notifyStats.__reset();
    const svc = require('../services/pushService');
    const pm = new (require('@prisma/client').PrismaClient)();
    const tokens = [
      { token: 'bad-1' },
      { token: 'bad-2' },
      { token: 'bad-3' },
      { token: 'good-1' },
      { token: 'good-2' },
    ];
    pm.deviceToken.findMany.mockResolvedValueOnce(tokens);
    const res = await svc.sendPushToUsers(['u1'], 'Title', 'Body');
    expect(res.success).toBe(true);

    const counters = getNotifyStatsMock().__counters.push;
    const delivered = tokens.length - failureCount;
    expect(counters.success).toBe(delivered);
    expect(counters.fail).toBe(failureCount);
    expect(counters.attempts).toBe(failureCount + 1);
    const computedRate = counters.success / (counters.success + counters.fail);
    expect(computedRate).toBeCloseTo(delivered / (delivered + failureCount));

    expect(publishNotificationEventMock).toHaveBeenCalled();
    const eventPayload =
      publishNotificationEventMock.mock.calls[publishNotificationEventMock.mock.calls.length - 1]?.[0];
    expect(eventPayload?.metadata?.failed).toBe(failureCount);
    expect(eventPayload?.metadata?.delivered).toBe(delivered);
  });
});
