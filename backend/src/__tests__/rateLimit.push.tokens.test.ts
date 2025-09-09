import request from 'supertest';
import app from '../app';

jest.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => { req.user = { id: 'u1', role: 'EMPLOYEE', isActive: true }; next(); },
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(() => ({
  deviceToken: { findMany: jest.fn(), create: jest.fn(async (d: any) => ({ id: 'dt1', ...d.data })), update: jest.fn(), delete: jest.fn() },
})) }));

describe('Write rate limit on push tokens', () => {
  beforeAll(() => {
    process.env.WRITE_RATE_LIMIT_ENABLED = 'true';
    process.env.WRITE_RATE_LIMIT_PER_MIN = '1';
    process.env.WRITE_RATE_LIMIT_WINDOW_MS = '10000';
  });
  afterAll(() => {
    delete (process.env as any).WRITE_RATE_LIMIT_ENABLED;
    delete (process.env as any).WRITE_RATE_LIMIT_PER_MIN;
    delete (process.env as any).WRITE_RATE_LIMIT_WINDOW_MS;
  });

  it('429 on second POST /api/push/tokens within window', async () => {
    const payload = { platform: 'ANDROID', token: 't-1' };
    const r1 = await request(app).post('/api/push/tokens').send(payload);
    expect([201, 200]).toContain(r1.status);
    const r2 = await request(app).post('/api/push/tokens').send(payload);
    expect(r2.status).toBe(429);
  });
});

