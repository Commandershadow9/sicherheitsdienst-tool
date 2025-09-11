import request from 'supertest';
import app from '../app';

jest.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => { req.user = { id: 'u', role: 'EMPLOYEE', isActive: true }; next(); },
  authorize: () => (_req: any, _res: any, next: any) => next(),
  authorizeSelfOr: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(() => ({})) }));

describe('Auth 405 Method Not Allowed', () => {
  it('GET /api/auth/login → 405', async () => {
    const res = await request(app).get('/api/auth/login');
    expect(res.status).toBe(405);
    expect(res.headers['allow']).toBe('POST');
  });

  it('GET /api/auth/refresh → 405', async () => {
    const res = await request(app).get('/api/auth/refresh');
    expect(res.status).toBe(405);
    expect(res.headers['allow']).toBe('POST');
  });

  it('POST /api/auth/me → 405 (requires auth)', async () => {
    const res = await request(app).post('/api/auth/me');
    expect(res.status).toBe(405);
    expect(res.headers['allow']).toBe('GET');
  });
});
