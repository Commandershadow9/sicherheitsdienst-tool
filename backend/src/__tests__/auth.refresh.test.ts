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
  const CUSTOMER_ID = 'cust-1';
  const userFixture = {
    id: USER_ID,
    email: 'user@example.com',
    password: 'hash',
    role: 'EMPLOYEE',
    isActive: true,
    customerId: CUSTOMER_ID,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.JWT_SECRET = 'test-access-secret';
    process.env.REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_EXPIRES_IN = '3600';
    process.env.REFRESH_EXPIRES_IN = '7200';
  });

  it('POST /api/auth/refresh → 200 (ok with customerId)', async () => {
    (global as any).prismaMock.user.findUnique.mockResolvedValueOnce(userFixture);
    const token = jwt.sign(
      { userId: USER_ID, role: 'EMPLOYEE', customerId: CUSTOMER_ID },
      process.env.REFRESH_SECRET as string,
      { expiresIn: '1h' }
    );
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: token });
    expect(res.status).toBe(200);
    
    // Tokens are now in Cookies, not body
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();
    expect(cookies).toEqual(expect.arrayContaining([
      expect.stringMatching(/^accessToken=/),
      expect.stringMatching(/^refreshToken=/)
    ]));

    // Verify new token contains customerId (decode from cookie)
    const accessTokenCookie = cookies.find((c: string) => c.startsWith('accessToken=')) || '';
    const accessTokenValue = accessTokenCookie.split(';')[0].split('=')[1];
    const decoded = jwt.decode(accessTokenValue) as any;
    expect(decoded.customerId).toBe(CUSTOMER_ID);
  });

  it('POST /api/auth/refresh → 401 (Tenant Mismatch)', async () => {
    // User belongs to cust-1, but token claims cust-2
    (global as any).prismaMock.user.findUnique.mockResolvedValueOnce(userFixture);
    const token = jwt.sign(
      { userId: USER_ID, role: 'EMPLOYEE', customerId: 'cust-2-ATTACKER' },
      process.env.REFRESH_SECRET as string,
      { expiresIn: '1h' }
    );
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: token });
    
    expect(res.status).toBe(401);
    // Depending on error handling, message might vary, but status MUST be 401
    expect(res.body.success).toBe(false);
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

