import request from 'supertest';
import app from '../app';

// Auth nur authenticate stubben ohne user → simuliert anonyme Anfrage; authorize real
jest.mock('../middleware/auth', () => {
  const actual = jest.requireActual('../middleware/auth');
  return {
    ...actual,
    authenticate: (_req: any, _res: any, next: any) => {
      // kein req.user setzen
      next();
    },
  };
});

describe('RBAC negative (anonymous) → 401', () => {
  it('POST /api/sites → 401', async () => {
    const res = await request(app).post('/api/sites').send({});
    expect(res.status).toBe(401);
  });
  it('PUT /api/sites/:id → 401', async () => {
    const res = await request(app).put('/api/sites/s1').send({ name: 'X' });
    expect(res.status).toBe(401);
  });
  it('DELETE /api/sites/:id → 401', async () => {
    const res = await request(app).delete('/api/sites/s1');
    expect(res.status).toBe(401);
  });

  it('POST /api/shifts → 401', async () => {
    const res = await request(app).post('/api/shifts').send({});
    expect(res.status).toBe(401);
  });
  it('PUT /api/shifts/:id → 401', async () => {
    const res = await request(app).put('/api/shifts/a1').send({ title: 'X' });
    expect(res.status).toBe(401);
  });
  it('DELETE /api/shifts/:id → 401', async () => {
    const res = await request(app).delete('/api/shifts/a1');
    expect(res.status).toBe(401);
  });
});

