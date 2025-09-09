import request from 'supertest';
import app from '../app';

jest.mock('@prisma/client', () => {
  (global as any).prismaMock = (global as any).prismaMock || {
    site: {
      count: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => (global as any).prismaMock) };
});

jest.mock('../middleware/auth', () => ({
  authenticate: (_req: any, _res: any, next: any) => next(),
  authorize: () => (_req: any, _res: any, next: any) => next(),
  authorizeSelfOr: () => (_req: any, _res: any, next: any) => next(),
}));

describe('Sites list (pagination/sort/filter)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('paginates and returns meta', async () => {
    (global as any).prismaMock.site.count.mockResolvedValueOnce(3);
    (global as any).prismaMock.site.findMany.mockResolvedValueOnce([
      { id: 's2', name: 'B', address: 'A2', city: 'X', postalCode: '2' },
    ]);
    const res = await request(app).get('/api/sites?page=2&pageSize=1&sortBy=name&sortDir=asc');
    expect(res.status).toBe(200);
    expect(res.body.pagination).toEqual({ page: 2, pageSize: 1, total: 3, totalPages: 3 });
    expect((global as any).prismaMock.site.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 1, take: 1, orderBy: { name: 'asc' } }),
    );
  });

  it('rejects invalid sort field (400)', async () => {
    const res = await request(app).get('/api/sites?sortBy=invalid');
    expect(res.status).toBe(400);
  });

  it('applies filter (name contains)', async () => {
    (global as any).prismaMock.site.count.mockResolvedValueOnce(1);
    (global as any).prismaMock.site.findMany.mockResolvedValueOnce([
      { id: 's1', name: 'Messe Berlin', address: 'Messedamm 22', city: 'Berlin', postalCode: '14055' },
    ]);
    const res = await request(app).get('/api/sites?filter[name]=Messe');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    const call = (global as any).prismaMock.site.findMany.mock.calls[0][0];
    expect(call.where.name.contains).toBe('Messe');
  });
});
