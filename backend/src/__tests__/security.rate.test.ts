import request from 'supertest';
import express from 'express';
import { __resetSecurityRateLimitStores, loginUserRateLimit } from '../middleware/security';

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

let testApp!: express.Application;

describe('Auth rate limits (IP + per-user/email)', () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.REFRESH_SECRET = 'refresh-secret';
    process.env.REFRESH_EXPIRES_IN = '30d';
    process.env.RATE_LIMIT_MAX = '10';
    process.env.RATE_LIMIT_WINDOW_MS = '60000';
    const mod = await import('../app');
    testApp = mod.default;
  });

  beforeEach(async () => {
    await __resetSecurityRateLimitStores();
  });

  afterAll(() => {
    delete (process.env as any).JWT_SECRET;
    delete (process.env as any).REFRESH_SECRET;
    delete (process.env as any).REFRESH_EXPIRES_IN;
    delete (process.env as any).RATE_LIMIT_MAX;
    delete (process.env as any).RATE_LIMIT_WINDOW_MS;
  });

  it('allows 10 quick logins per IP, then returns 429 on the 11th', async () => {
    const base = '/api/auth/login';
    const ip = '1.2.3.4';
    const results: number[] = [];
    for (let i = 0; i < 10; i++) {
      const email = `user${i}@example.com`;
      const res = await request(testApp)
        .post(base)
        .set('X-Forwarded-For', ip)
        .send({ email, password: 'Password123!' });
      results.push(res.status);
    }
    const extra = await request(testApp)
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
      const r = await request(testApp)
        .post(base)
        .set('X-Forwarded-For', '10.0.0.1')
        .send({ email, password: 'Password123!' });
      expect(r.status).toBeLessThan(400);
    }
    // 6th attempt from IP B should still be blocked by per-user limiter
    const r6 = await request(testApp)
      .post(base)
      .set('X-Forwarded-For', '10.0.0.2')
      .send({ email, password: 'Password123!' });
    expect(r6.status).toBe(429);
  });

  it('respects LOGIN_RATE_LIMIT_MAX override via env', async () => {
    const prevMax = process.env.LOGIN_RATE_LIMIT_MAX;
    const prevWindow = process.env.LOGIN_RATE_LIMIT_WINDOW_MS;
    process.env.LOGIN_RATE_LIMIT_MAX = '3';
    process.env.LOGIN_RATE_LIMIT_WINDOW_MS = '60000';
    await __resetSecurityRateLimitStores();

    const limiterApp = express();
    limiterApp.use(express.json());
    limiterApp.post('/login', loginUserRateLimit(), (_req, res) => {
      res.status(200).json({ ok: true });
    });

    for (let i = 0; i < 3; i++) {
      const ok = await request(limiterApp).post('/login').send({ email: 'env@example.com', password: 'x' });
      expect(ok.status).toBe(200);
    }
    const blocked = await request(limiterApp).post('/login').send({ email: 'env@example.com', password: 'x' });
    expect(blocked.status).toBe(429);

    if (prevMax === undefined) delete process.env.LOGIN_RATE_LIMIT_MAX;
    else process.env.LOGIN_RATE_LIMIT_MAX = prevMax;
    if (prevWindow === undefined) delete process.env.LOGIN_RATE_LIMIT_WINDOW_MS;
    else process.env.LOGIN_RATE_LIMIT_WINDOW_MS = prevWindow;
  });

  it('allows new attempts after the login limiter window expires', async () => {
    const prevMax = process.env.LOGIN_RATE_LIMIT_MAX;
    const prevWindow = process.env.LOGIN_RATE_LIMIT_WINDOW_MS;
    process.env.LOGIN_RATE_LIMIT_MAX = '2';
    process.env.LOGIN_RATE_LIMIT_WINDOW_MS = '200';
    await __resetSecurityRateLimitStores();

    const ttlApp = express();
    ttlApp.use(express.json());
    ttlApp.post('/login', loginUserRateLimit(), (_req, res) => {
      res.status(200).json({ ok: true });
    });

    const ok1 = await request(ttlApp).post('/login').send({ email: 'ttl@example.com', password: 'x' });
    const ok2 = await request(ttlApp).post('/login').send({ email: 'ttl@example.com', password: 'x' });
    expect(ok1.status).toBe(200);
    expect(ok2.status).toBe(200);

    const limited = await request(ttlApp).post('/login').send({ email: 'ttl@example.com', password: 'x' });
    expect(limited.status).toBe(429);

    await new Promise((resolve) => setTimeout(resolve, 250));

    const afterWindow = await request(ttlApp)
      .post('/login')
      .send({ email: 'ttl@example.com', password: 'x' });
    expect(afterWindow.status).toBe(200);

    if (prevMax === undefined) delete process.env.LOGIN_RATE_LIMIT_MAX;
    else process.env.LOGIN_RATE_LIMIT_MAX = prevMax;
    if (prevWindow === undefined) delete process.env.LOGIN_RATE_LIMIT_WINDOW_MS;
    else process.env.LOGIN_RATE_LIMIT_WINDOW_MS = prevWindow;
  });

  it('disables login limiter when LOGIN_RATE_LIMIT_MAX <= 0', async () => {
    const prevMax = process.env.LOGIN_RATE_LIMIT_MAX;
    const prevWindow = process.env.LOGIN_RATE_LIMIT_WINDOW_MS;
    process.env.LOGIN_RATE_LIMIT_MAX = '0';
    process.env.LOGIN_RATE_LIMIT_WINDOW_MS = '60000';
    await __resetSecurityRateLimitStores();

    const noLimitApp = express();
    noLimitApp.use(express.json());
    noLimitApp.post('/login', loginUserRateLimit(), (_req, res) => {
      res.status(200).json({ ok: true });
    });

    // far more than default to ensure no limiter kicks in
    for (let i = 0; i < 10; i++) {
      const res = await request(noLimitApp).post('/login').send({ email: 'nolimit@example.com', password: 'x' });
      expect(res.status).toBe(200);
    }

    if (prevMax === undefined) delete process.env.LOGIN_RATE_LIMIT_MAX;
    else process.env.LOGIN_RATE_LIMIT_MAX = prevMax;
    if (prevWindow === undefined) delete process.env.LOGIN_RATE_LIMIT_WINDOW_MS;
    else process.env.LOGIN_RATE_LIMIT_WINDOW_MS = prevWindow;
  });
});
