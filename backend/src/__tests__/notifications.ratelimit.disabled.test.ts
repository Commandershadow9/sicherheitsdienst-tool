import request from 'supertest';
import app from '../app';

jest.mock('../middleware/auth', () => ({
  authenticate: (_req: any, _res: any, next: any) => {
    _req.user = { id: 'u1', role: 'ADMIN' };
    next();
  },
}));

jest.mock('../services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

describe('Notifications Rate Limit disabled', () => {
  beforeEach(() => {
    process.env.NOTIFICATIONS_TEST_RATE_LIMIT_ENABLED = 'false';
    process.env.NOTIFICATIONS_TEST_RATE_LIMIT_PER_MIN = '1';
    process.env.NOTIFICATIONS_TEST_RATE_LIMIT_WINDOW_MS = '1000';
  });

  const payload = { recipient: 'to@example.com', title: 'T', body: 'B', channel: 'email' };

  it('does not rate limit when disabled', async () => {
    const r1 = await request(app).post('/api/notifications/test').send(payload);
    const r2 = await request(app).post('/api/notifications/test').send(payload);
    const r3 = await request(app).post('/api/notifications/test').send(payload);
    expect(r1.status).toBeLessThan(400);
    expect(r2.status).toBeLessThan(400);
    expect(r3.status).toBeLessThan(400);
  });
});

