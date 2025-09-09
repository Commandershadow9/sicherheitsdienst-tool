import request from 'supertest';
import app from '../app';

jest.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => { req.user = { id: 'u', role: 'ADMIN', isActive: true }; next(); },
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(() => ({})) }));

describe('Shifts 405 Method Not Allowed', () => {
  it('PATCH /api/shifts → 405 Allow header', async () => {
    const res = await request(app).patch('/api/shifts').send({});
    expect(res.status).toBe(405);
    expect(res.headers['allow']).toBe('GET, POST');
  });

  it('GET /api/shifts/:id/assign → 405 Allow header', async () => {
    const res = await request(app).get('/api/shifts/s1/assign');
    expect(res.status).toBe(405);
    expect(res.headers['allow']).toBe('POST');
  });

  it('DELETE /api/shifts/:id/clock-in → 405', async () => {
    const res = await request(app).delete('/api/shifts/s1/clock-in');
    expect(res.status).toBe(405);
    expect(res.headers['allow']).toBe('POST');
  });
});

