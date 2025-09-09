import request from 'supertest';
import app from '../app';

jest.mock('@prisma/client', () => {
  (global as any).prismaMock = (global as any).prismaMock || {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => (global as any).prismaMock) };
});

jest.mock('../middleware/auth', () => ({
  authenticate: (_req: any, _res: any, next: any) => next(),
  authorize: () => (_req: any, _res: any, next: any) => next(),
  authorizeSelfOr: () => (_req: any, _res: any, next: any) => next(),
}));

describe('Users list (pagination/sort/filter)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('paginates and sorts by firstName by default', async () => {
    (global as any).prismaMock.user.count.mockResolvedValueOnce(2);
    (global as any).prismaMock.user.findMany.mockResolvedValueOnce([
      { id: 'u1', email: 'a@x', firstName: 'A', lastName: 'B', isActive: true },
    ]);
    const res = await request(app).get('/api/users?page=1&pageSize=1');
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(2);
    const call = (global as any).prismaMock.user.findMany.mock.calls[0][0];
    expect(call.orderBy).toEqual({ firstName: 'asc' });
  });

  it('rejects invalid sort field (400)', async () => {
    const res = await request(app).get('/api/users?sortBy=foo');
    expect(res.status).toBe(400);
  });

  it('applies filter (email contains)', async () => {
    (global as any).prismaMock.user.count.mockResolvedValueOnce(1);
    (global as any).prismaMock.user.findMany.mockResolvedValueOnce([
      { id: 'u2', email: 'john.doe@example.com', firstName: 'John', lastName: 'Doe', isActive: true },
    ]);
    const res = await request(app).get('/api/users?filter[email]=john.doe');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});
