import request from 'supertest';
import app from '../app';

// Auth nur partiell mocken: authenticate stubben, authorize real
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

describe('RBAC negative (EMPLOYEE) → 403', () => {
  // Users (ADMIN/DISPATCHER required on list; ADMIN on create/delete)
  it('GET /api/users → 403', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(403);
  });
  it('POST /api/users → 403', async () => {
    const res = await request(app).post('/api/users').send({});
    expect(res.status).toBe(403);
  });
  it('DELETE /api/users/:id → 403', async () => {
    const res = await request(app).delete('/api/users/u1');
    expect(res.status).toBe(403);
  });

  it('POST /api/sites → 403', async () => {
    const res = await request(app).post('/api/sites').send({});
    expect(res.status).toBe(403);
  });
  it('PUT /api/sites/:id → 403', async () => {
    const res = await request(app).put('/api/sites/s1').send({ name: 'X' });
    expect(res.status).toBe(403);
  });
  it('DELETE /api/sites/:id → 403', async () => {
    const res = await request(app).delete('/api/sites/s1');
    expect(res.status).toBe(403);
  });

  it('POST /api/shifts → 403', async () => {
    const res = await request(app).post('/api/shifts').send({});
    expect(res.status).toBe(403);
  });
  it('PUT /api/shifts/:id → 403', async () => {
    const res = await request(app).put('/api/shifts/a1').send({ title: 'X' });
    expect(res.status).toBe(403);
  });
  it('DELETE /api/shifts/:id → 403', async () => {
    const res = await request(app).delete('/api/shifts/a1');
    expect(res.status).toBe(403);
  });
});
