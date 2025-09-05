import request from 'supertest';
import app from '../app';

jest.mock('@prisma/client', () => {
  (global as any).prismaMock = (global as any).prismaMock || {
    shift: {
      count: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => (global as any).prismaMock) };
});

jest.mock('../middleware/auth', () => ({
  authenticate: (_req: any, _res: any, next: any) => next(),
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

describe('Shifts list (pagination/sort/filter)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('paginates with default sort', async () => {
    (global as any).prismaMock.shift.count.mockResolvedValueOnce(2);
    (global as any).prismaMock.shift.findMany.mockResolvedValueOnce([
      { id: 'sh1', title: 'A', location: 'L', startTime: new Date().toISOString(), endTime: new Date().toISOString() },
    ]);
    const res = await request(app).get('/api/shifts?page=1&pageSize=1');
    expect(res.status).toBe(200);
    expect(res.body.pagination).toEqual({ page: 1, pageSize: 1, total: 2, totalPages: 2 });
    expect((global as any).prismaMock.shift.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 1, orderBy: { startTime: 'asc' } }),
    );
  });

  it('rejects invalid sort field (400)', async () => {
    const res = await request(app).get('/api/shifts?sortBy=invalid');
    expect(res.status).toBe(400);
  });

  it('applies filter (title contains)', async () => {
    (global as any).prismaMock.shift.count.mockResolvedValueOnce(1);
    (global as any).prismaMock.shift.findMany.mockResolvedValueOnce([
      { id: 'sh2', title: 'Nacht', location: 'HQ', startTime: new Date().toISOString(), endTime: new Date().toISOString() },
    ]);
    const res = await request(app).get('/api/shifts?filter[title]=Nacht');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    const call = (global as any).prismaMock.shift.findMany.mock.calls[0][0];
    expect(call.where.title.contains).toBe('Nacht');
  });
});

