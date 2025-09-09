import request from 'supertest';
import app from '../app';

jest.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => { req.user = { id: 'u', role: 'ADMIN', isActive: true }; next(); },
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(() => ({})) }));

describe('Sites 405 Method Not Allowed', () => {
  it('PATCH /api/sites → 405 Allow header', async () => {
    const res = await request(app).patch('/api/sites').send({});
    expect(res.status).toBe(405);
    expect(res.headers['allow']).toBe('GET, POST');
  });

  it('POST /api/sites/:id/shifts → 405 Allow header', async () => {
    const res = await request(app).post('/api/sites/s1/shifts').send({});
    expect(res.status).toBe(405);
    expect(res.headers['allow']).toBe('GET');
  });
});

