import request from 'supertest';
import app from '../app';
import { __resetSecurityRateLimitStores } from '../middleware/security';

// Mock bcrypt to always succeed
jest.mock('bcryptjs', () => ({
  compare: jest.fn(async () => true),
}));

// Mock prisma: any email returns an active user with matching password
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: {
      findUnique: jest.fn(async ({ where }: any) =>
        where?.email
          ? {
              id: `user-${where.email}`,
              email: where.email,
              password: '$2a$10$hash',
              role: 'ADMIN',
              isActive: true,
            }
          : null,
      ),
    },
  })),
}));

describe('Auth rate limits (IP + per-user/email)', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.RATE_LIMIT_MAX = '10';
    process.env.RATE_LIMIT_WINDOW_MS = '60000';
  });

  beforeEach(() => {
    __resetSecurityRateLimitStores();
  });

  afterAll(() => {
    delete (process.env as any).JWT_SECRET;
    delete (process.env as any).RATE_LIMIT_MAX;
    delete (process.env as any).RATE_LIMIT_WINDOW_MS;
  });

  it('allows 10 quick logins per IP, then returns 429 on the 11th', async () => {
    const base = '/api/auth/login';
    const ip = '1.2.3.4';
    const results: number[] = [];
    for (let i = 0; i < 10; i++) {
      const email = `user${i}@example.com`;
      const res = await request(app)
        .post(base)
        .set('X-Forwarded-For', ip)
        .send({ email, password: 'Password123!' });
      results.push(res.status);
    }
    const extra = await request(app)
      .post(base)
      .set('X-Forwarded-For', ip)
      .send({ email: 'extra@example.com', password: 'Password123!' });
    results.push(extra.status);

    // 10 OK (<400), then 429
    expect(results.slice(0, 10).every((s) => s < 400)).toBe(true);
    expect(results[10]).toBe(429);
  });

  it('user/email limiter triggers across IP changes', async () => {
    const base = '/api/auth/login';
    const email = 'alice@example.com';
    // 5 attempts from IP A
    for (let i = 0; i < 5; i++) {
      const r = await request(app)
        .post(base)
        .set('X-Forwarded-For', '10.0.0.1')
        .send({ email, password: 'Password123!' });
      expect(r.status).toBeLessThan(400);
    }
    // 6th attempt from IP B should still be blocked by per-user limiter
    const r6 = await request(app)
      .post(base)
      .set('X-Forwarded-For', '10.0.0.2')
      .send({ email, password: 'Password123!' });
    expect(r6.status).toBe(429);
  });
});
