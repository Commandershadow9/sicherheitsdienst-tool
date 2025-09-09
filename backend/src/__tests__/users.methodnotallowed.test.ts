import request from 'supertest';
import app from '../app';

jest.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => { req.user = { id: 'u', role: 'ADMIN', isActive: true }; next(); },
  authorize: () => (_req: any, _res: any, next: any) => next(),
  authorizeSelfOr: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(() => ({})) }));

describe('Users 405 Method Not Allowed', () => {
  it('PUT /api/users → 405 with Allow header', async () => {
    const res = await request(app).put('/api/users').send({});
    expect(res.status).toBe(405);
    expect(res.headers['allow']).toBe('GET, POST');
  });

  it('PATCH /api/users/:id → 405 with Allow header', async () => {
    const res = await request(app).patch('/api/users/u1').send({});
    expect(res.status).toBe(405);
    expect(res.headers['allow']).toBe('GET, PUT, DELETE');
  });
});

