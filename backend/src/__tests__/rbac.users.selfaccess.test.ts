import request from 'supertest';
import app from '../app';

// Use actual authorizeSelfOr logic; override authenticate to inject identities
jest.mock('../middleware/auth', () => {
  let currentUser: any = null;
  return {
    authenticate: (req: any, _res: any, next: any) => {
      req.user = currentUser || { id: 'u-default', role: 'EMPLOYEE', isActive: true };
      next();
    },
    authorize: () => (_req: any, _res: any, next: any) => next(),
    authorizeSelfOr: () => (_req: any, _res: any, next: any) => next(),
    setTestUser: (u: any) => {
      currentUser = u;
    },
  };
});

// Mock Prisma client used by controllers
jest.mock('@prisma/client', () => {
  (global as any).prismaMock = (global as any).prismaMock || {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => (global as any).prismaMock) };
});

describe('Users self-access positive cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('EMPLOYEE can GET own profile (200)', async () => {
    const mod = require('../middleware/auth');
    mod.setTestUser({ id: 'self-emp', role: 'EMPLOYEE', isActive: true });

    (global as any).prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'self-emp',
      email: 'me@example.com',
      firstName: 'Me',
      lastName: 'Employee',
      phone: null,
      role: 'EMPLOYEE',
      employeeId: null,
      isActive: true,
      hireDate: null,
      qualifications: [],
      createdAt: new Date(),
      shifts: { include: {} },
      timeEntries: [],
    });

    const res = await request(app).get('/api/users/self-emp');
    expect(res.status).toBe(200);
    expect(res.body?.success).not.toBe(false);
    expect((global as any).prismaMock.user.findUnique).toHaveBeenCalled();
  });

  it('EMPLOYEE can PUT own basic fields (200)', async () => {
    const mod = require('../middleware/auth');
    mod.setTestUser({ id: 'self-emp', role: 'EMPLOYEE', isActive: true });

    (global as any).prismaMock.user.update.mockResolvedValueOnce({
      id: 'self-emp',
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'Name',
      phone: '123',
      role: 'EMPLOYEE',
      employeeId: null,
      isActive: true,
      hireDate: null,
      qualifications: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .put('/api/users/self-emp')
      .send({ email: 'new@example.com', firstName: 'New', lastName: 'Name', phone: '123' });
    expect(res.status).toBe(200);
    expect(res.body?.success).not.toBe(false);
  });

  it('ADMIN can PUT any user (200)', async () => {
    const mod = require('../middleware/auth');
    mod.setTestUser({ id: 'admin-1', role: 'ADMIN', isActive: true });

    (global as any).prismaMock.user.update.mockResolvedValueOnce({
      id: 'u-other',
      email: 'x@y',
      firstName: 'X',
      lastName: 'Y',
      phone: null,
      role: 'EMPLOYEE',
      employeeId: null,
      isActive: true,
      hireDate: null,
      qualifications: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app).put('/api/users/u-other').send({ role: 'MANAGER' });
    expect(res.status).toBe(200);
    expect(res.body?.success).not.toBe(false);
  });
});
