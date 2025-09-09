import request from 'supertest';
import app from '../app';

// Do not mock authenticate here to ensure real 401 when no token
// Mock Prisma to avoid accidental DB usage
jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(() => ({})) }));

describe('RBAC negative (anonymous) for Incidents → 401', () => {
  it('GET /api/incidents → 401', async () => {
    const res = await request(app).get('/api/incidents');
    expect(res.status).toBe(401);
  });
  it('GET /api/incidents/:id → 401', async () => {
    const res = await request(app).get('/api/incidents/i1');
    expect(res.status).toBe(401);
  });
  it('POST /api/incidents → 401', async () => {
    const res = await request(app).post('/api/incidents').send({});
    expect(res.status).toBe(401);
  });
});

