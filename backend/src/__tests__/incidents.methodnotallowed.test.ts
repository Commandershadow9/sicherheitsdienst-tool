import request from 'supertest';
import app from '../app';

// Auth: authenticate mocked to provide a user
jest.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => { req.user = { id: 'u1', role: 'EMPLOYEE', isActive: true }; next(); },
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

// Minimal Prisma mock
jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(() => ({})) }));

describe('Incidents Method Not Allowed (405)', () => {
  it('PUT /api/incidents → 405 with Allow header', async () => {
    const res = await request(app).put('/api/incidents').send({});
    expect(res.status).toBe(405);
    expect(res.headers['allow']).toBe('GET, POST');
    expect(res.body).toMatchObject({ success: false, code: 'METHOD_NOT_ALLOWED' });
  });

  it('POST /api/incidents/:id → 405 with Allow header', async () => {
    const res = await request(app).post('/api/incidents/i1').send({});
    expect(res.status).toBe(405);
    expect(res.headers['allow']).toBe('GET, PUT, DELETE');
  });
});

