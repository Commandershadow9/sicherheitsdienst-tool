import request from 'supertest';
import app from '../app';

jest.mock('../middleware/auth', () => ({
  authenticate: (_req: any, _res: any, next: any) => {
    _req.user = { id: 'u1', role: 'ADMIN', isActive: true };
    next();
  },
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock('@prisma/client', () => {
  (global as any).prismaMock = (global as any).prismaMock || {
    user: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'u1',
          email: 'jane.doe@example.com',
          firstName: 'Jane',
          lastName: 'Doe',
          phone: '+49 151 234',
          role: 'EMPLOYEE',
          employeeId: 'E-1',
          isActive: true,
          hireDate: new Date('2024-01-15T00:00:00Z'),
          qualifications: ['Sicherheitskraft'],
          createdAt: new Date('2024-08-01T12:00:00Z'),
          updatedAt: new Date('2024-08-15T12:00:00Z'),
        },
      ]),
    },
  };
  return { PrismaClient: jest.fn(() => (global as any).prismaMock) };
});

describe('GET /api/users XLSX export', () => {
  it('returns XLSX when Accept xlsx is sent', async () => {
    const res = await request(app)
      .get('/api/users?page=1&pageSize=1')
      .set('Accept', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/vnd.openxmlformats-officedocument.spreadsheetml.sheet/);
    // XLSX ist ZIP-Container → beginnt mit 'PK'
    const buf: Buffer = res.body as any;
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.slice(0, 2).toString('ascii')).toBe('PK');
  });
});
