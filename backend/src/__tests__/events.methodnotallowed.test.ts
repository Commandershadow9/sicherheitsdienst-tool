import request from 'supertest';
import app from '../app';

jest.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => { req.user = { id: 'u', role: 'ADMIN', isActive: true }; next(); },
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(() => ({})) }));

describe('Events 405 Method Not Allowed', () => {
  it('PUT /api/events → 405 Allow header', async () => {
    const res = await request(app).put('/api/events').send({});
    expect(res.status).toBe(405);
    expect(res.headers['allow']).toBe('GET, POST');
  });

  it('POST /api/events/:id → 405', async () => {
    const res = await request(app).post('/api/events/e1').send({});
    expect(res.status).toBe(405);
    expect(res.headers['allow']).toBe('GET, PUT, DELETE');
  });
});

