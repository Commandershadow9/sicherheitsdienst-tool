import request from 'supertest';
import app from '../app';

// Mock auth as ADMIN for write endpoints
jest.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => { req.user = { id: 'admin', role: 'ADMIN', isActive: true }; next(); },
  authorize: () => (_req: any, _res: any, next: any) => next(),
  authorizeSelfOr: () => (_req: any, _res: any, next: any) => next(),
}));

// Mock prisma to allow site create to succeed
jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(() => ({ site: { create: jest.fn(async (d: any) => ({ id: 's1', ...d.data })) } })) }));

describe('Write rate limit', () => {
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

  it('limits consecutive POST /api/sites requests for same user', async () => {
    const payload = { name: 'A', address: 'B', city: 'C', postalCode: '12345' };
    const r1 = await request(app).post('/api/sites').send(payload);
    expect([201, 200]).toContain(r1.status);
    const r2 = await request(app).post('/api/sites').send(payload);
    expect(r2.status).toBe(429);
    expect(r2.body).toMatchObject({ success: false, code: 'TOO_MANY_REQUESTS' });
  });
});

