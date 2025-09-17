import request from 'supertest';
import app from '../app';

jest.mock('@prisma/client', () => {
  (global as any).assignPrismaMock = (global as any).assignPrismaMock || {
    shift: { findUnique: jest.fn() },
    shiftAssignment: { findUnique: jest.fn(), create: jest.fn() },
  };
  return { PrismaClient: jest.fn(() => (global as any).assignPrismaMock) };
});

jest.mock('../middleware/auth', () => {
  const actual = jest.requireActual('../middleware/auth');
  return {
    ...actual,
    authenticate: (req: any, _res: any, next: any) => {
      const fallback = { id: 'emp', role: 'EMPLOYEE', isActive: true };
      req.user = (global as any).__assignTestUser || fallback;
      next();
    },
  };
});

describe('Shift assignment RBAC', () => {
  const pm = (global as any).assignPrismaMock;

  beforeEach(() => {
    pm.shift.findUnique.mockReset();
    pm.shiftAssignment.findUnique.mockReset();
    pm.shiftAssignment.create.mockReset();
    delete (global as any).__assignTestUser;
  });

  it('rejects EMPLOYEE without required role', async () => {
    (global as any).__assignTestUser = { id: 'emp-1', role: 'EMPLOYEE', isActive: true };
    const res = await request(app).post('/api/shifts/s1/assign').send({ userId: 'u1' });
    expect(res.status).toBe(403);
  });

  it('allows ADMIN to assign', async () => {
    pm.shift.findUnique.mockResolvedValueOnce({ id: 's1', assignments: [] });
    pm.shiftAssignment.findUnique.mockResolvedValueOnce(null);
    pm.shiftAssignment.create.mockResolvedValueOnce({
      id: 'assign-1',
      userId: 'u1',
      shiftId: 's1',
      status: 'ASSIGNED',
    });
    (global as any).__assignTestUser = { id: 'admin-1', role: 'ADMIN', isActive: true };

    const res = await request(app).post('/api/shifts/s1/assign').send({ userId: 'u1' });
    expect(res.status).toBe(201);
  });
});
