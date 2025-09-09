import { incrPushSuccess, incrPushFail } from '../utils/notifyStats';

jest.mock('../utils/notifyStats', () => {
  const counters = { email: { success: 0, fail: 0 }, push: { success: 0, fail: 0 } };
  return {
    incrPushSuccess: (n: number) => { counters.push.success += n; },
    incrPushFail: () => { counters.push.fail += 1; },
    __counters: counters,
  };
});

jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(() => ({
  deviceToken: { updateMany: jest.fn(), findMany: jest.fn() },
})) }));

describe('pushService', () => {
  beforeEach(() => {
    process.env.FCM_PROJECT_ID = '';
    process.env.FCM_CLIENT_EMAIL = '';
    process.env.FCM_PRIVATE_KEY = '';
  });

  it('mock path increments success when FCM not configured', async () => {
    const svc = require('../services/pushService');
    const pm = new (require('@prisma/client').PrismaClient)();
    pm.deviceToken.findMany.mockResolvedValueOnce([{ token: 't1' }, { token: 't2' }]);
    const res = await svc.sendPushToUsers(['u1'], 'T', 'B');
    expect(res.success).toBe(true);
  });

  it('FCM path disables invalid tokens', async () => {
    process.env.FCM_PROJECT_ID = 'p';
    process.env.FCM_CLIENT_EMAIL = 'c';
    process.env.FCM_PRIVATE_KEY = 'k';
    jest.resetModules();
    const adminMock = {
      credential: { cert: jest.fn(() => ({})) },
      initializeApp: jest.fn(),
      messaging: jest.fn(() => ({
        sendEachForMulticast: jest.fn(async () => ({
          failureCount: 1,
          responses: [ { success: false, error: { code: 'messaging/registration-token-not-registered' } }, { success: true } ],
        })),
      })),
    };
    jest.doMock('firebase-admin', () => adminMock, { virtual: true });
    const svc = require('../services/pushService');
    const pm = new (require('@prisma/client').PrismaClient)();
    pm.deviceToken.findMany.mockResolvedValueOnce([{ token: 'bad' }, { token: 'good' }]);
    const res = await svc.sendPushToUsers(['u1'], 'T', 'B');
    expect(res.success).toBe(true);
    expect(pm.deviceToken.updateMany).toHaveBeenCalled();
  });
});

