import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';

// Prisma-Client global mocken
jest.mock('@prisma/client', () => {
  (global as any).prismaMock = (global as any).prismaMock || {
    user: {
      findUnique: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => (global as any).prismaMock) };
});

describe('Auth Refresh', () => {
  const USER_ID = 'user-1';
  const userFixture = {
    id: USER_ID,
    email: 'user@example.com',
    password: 'hash',
    role: 'EMPLOYEE',
    isActive: true,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.JWT_SECRET = 'test-access-secret';
    process.env.REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_EXPIRES_IN = '3600';
    process.env.REFRESH_EXPIRES_IN = '7200';
  });

  it('POST /api/auth/refresh → 200 (ok)', async () => {
    (global as any).prismaMock.user.findUnique.mockResolvedValueOnce(userFixture);
    const token = jwt.sign({ userId: USER_ID, role: 'EMPLOYEE' }, process.env.REFRESH_SECRET as string, {
      expiresIn: '1h',
    });
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: token });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(typeof res.body.expiresIn).toBe('number');
  });

  it('POST /api/auth/refresh → 422 (invalid payload)', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(res.status).toBe(422);
  });

  it('POST /api/auth/refresh → 401 (invalid token)', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'invalid' });
    expect(res.status).toBe(401);
  });
});

