import request from 'supertest';
import app from '../app';

jest.mock('../middleware/auth', () => ({
  authenticate: (_req: any, _res: any, next: any) => {
    _req.user = { id: 'u1', role: 'ADMIN' };
    next();
  },
  authorize: () => (_req: any, _res: any, next: any) => next(),
  authorizeSelfOr: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../middleware/rbac', () => ({
  notificationsRBAC: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

describe('Notifications Test Rate Limit', () => {
  beforeEach(() => {
    process.env.NOTIFICATIONS_TEST_RATE_LIMIT_PER_MIN = '2';
    process.env.NOTIFICATIONS_TEST_RATE_LIMIT_WINDOW_MS = '1000';
    process.env.NOTIFICATIONS_TEST_RATE_LIMIT_ENABLED = 'true';
  });

  const payload = { recipient: 'to@example.com', title: 'T', body: 'B', channel: 'email' };

  it('allows up to limit and then 429', async () => {
    const r1 = await request(app).post('/api/notifications/test').send(payload);
    const r2 = await request(app).post('/api/notifications/test').send(payload);
    const r3 = await request(app).post('/api/notifications/test').send(payload);
    expect(r1.status).toBeLessThan(400);
    expect(r2.status).toBeLessThan(400);
    expect(r3.status).toBe(429);
    // Headers present
    expect(r1.headers['ratelimit-limit']).toBeDefined();
    expect(r1.headers['ratelimit-remaining']).toBeDefined();
    expect(r3.headers['retry-after']).toBeDefined();
  });
});
