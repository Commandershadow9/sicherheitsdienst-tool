import request from 'supertest';
import app from '../app';

// Auth: authenticate mocked (EMPLOYEE), authorize real
jest.mock('../middleware/auth', () => {
  const actual = jest.requireActual('../middleware/auth');
  return {
    ...actual,
    authenticate: (_req: any, _res: any, next: any) => {
      _req.user = { id: 'u1', role: 'EMPLOYEE', isActive: true };
      next();
    },
  };
});

// Minimal Prisma mock to avoid DB usage
jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(() => ({ incident: {} })) }));

describe('RBAC negative (EMPLOYEE) for Incidents', () => {
  it('POST /api/incidents → 403', async () => {
    const res = await request(app).post('/api/incidents').send({ title: 't', severity: 'LOW', location: 'x', occurredAt: new Date().toISOString() });
    expect(res.status).toBe(403);
  });
  it('PUT /api/incidents/:id → 403', async () => {
    const res = await request(app).put('/api/incidents/i1').send({ title: 'X' });
    expect(res.status).toBe(403);
  });
  it('DELETE /api/incidents/:id → 403', async () => {
    const res = await request(app).delete('/api/incidents/i1');
    expect(res.status).toBe(403);
  });
});

