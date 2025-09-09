import request from 'supertest';
import app from '../app';

// authenticate wird überschrieben, authorize bleibt real
jest.mock('../middleware/auth', () => {
  const actual = jest.requireActual('../middleware/auth');
  let currentUser: any = null;
  return {
    ...actual, // nutzt echte authorize/authorizeSelfOr Logik
    authenticate: (req: any, _res: any, next: any) => {
      req.user = currentUser || null;
      next();
    },
    setTestUser: (u: any) => {
      currentUser = u;
    },
  };
});

describe('RBAC negative (EMPLOYEE) for /api/users/:id', () => {
  beforeAll(() => {
    const mod = require('../middleware/auth');
    mod.setTestUser({ id: 'u-employee', role: 'EMPLOYEE', isActive: true });
  });

  it('GET /api/users/:id → 403 (EMPLOYEE, fremde ID)', async () => {
    const res = await request(app).get('/api/users/u-other');
    expect(res.status).toBe(403);
  });

  it('PUT /api/users/:id → 403 (EMPLOYEE, fremde ID)', async () => {
    const res = await request(app).put('/api/users/u-other').send({ firstName: 'X' });
    expect(res.status).toBe(403);
  });
});

describe('RBAC negative (MANAGER) for /api/users/:id', () => {
  beforeAll(() => {
    const mod = require('../middleware/auth');
    mod.setTestUser({ id: 'u-manager', role: 'MANAGER', isActive: true });
  });

  it('GET /api/users/:id → 403 (MANAGER)', async () => {
    const res = await request(app).get('/api/users/u-other');
    expect(res.status).toBe(403);
  });

  it('PUT /api/users/:id → 403 (MANAGER)', async () => {
    const res = await request(app).put('/api/users/u-other').send({ firstName: 'Y' });
    expect(res.status).toBe(403);
  });
});
