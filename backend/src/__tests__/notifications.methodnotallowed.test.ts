import request from 'supertest';
import app from '../app';

jest.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => { req.user = { id: 'u', role: 'ADMIN', isActive: true }; next(); },
  authorize: () => (_req: any, _res: any, next: any) => next(),
  authorizeSelfOr: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(() => ({})) }));

describe('Notifications 405 Method Not Allowed', () => {
  it('GET /api/notifications/test → 405', async () => {
    const res = await request(app).get('/api/notifications/test');
    expect(res.status).toBe(405);
    expect(res.headers['allow']).toBe('POST');
  });
});
