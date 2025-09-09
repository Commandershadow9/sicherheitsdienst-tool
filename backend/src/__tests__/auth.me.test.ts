import request from 'supertest';
import app from '../app';

// Auth-Middleware für Tests stubben
jest.mock('../middleware/auth', () => ({
  authenticate: (_req: any, _res: any, next: any) => {
    _req.user = {
      id: 'u1',
      email: 'user@example.com',
      firstName: 'Max',
      lastName: 'Mustermann',
      role: 'EMPLOYEE',
      isActive: true,
      password: 'secret', // wird im Controller entfernt
    };
    next();
  },
  authorize: () => (_req: any, _res: any, next: any) => next(),
  authorizeSelfOr: () => (_req: any, _res: any, next: any) => next(),
}));

describe('GET /api/auth/me', () => {
  it('liefert aktuellen Benutzer (200)', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('user@example.com');
    expect(res.body.data.password).toBeUndefined();
  });
});
