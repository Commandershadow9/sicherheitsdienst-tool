import request from 'supertest';
import app from '../app';

jest.mock('../middleware/auth', () => ({
  authenticate: (_req: any, _res: any, next: any) => {
    _req.user = { id: 'u1', role: 'ADMIN', isActive: true };
    next();
  },
  authorize: () => (_req: any, _res: any, next: any) => next(),
  authorizeSelfOr: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock('@prisma/client', () => {
  (global as any).prismaMock = (global as any).prismaMock || {
    shift: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'sh1',
          siteId: 's1',
          title: 'T',
          location: 'Loc',
          startTime: new Date('2024-09-01T22:00:00Z'),
          endTime: new Date('2024-09-02T06:00:00Z'),
          requiredEmployees: 2,
          status: 'PLANNED',
          createdAt: new Date('2024-08-25T10:00:00Z'),
          updatedAt: new Date('2024-08-25T10:00:00Z'),
          assignments: [],
        },
      ]),
    },
  };
  return { PrismaClient: jest.fn(() => (global as any).prismaMock) };
});

describe('GET /api/shifts CSV export', () => {
  it('returns CSV when Accept text/csv is sent', async () => {
    const res = await request(app).get('/api/shifts?page=1&pageSize=1').set('Accept', 'text/csv');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text.split('\n')[0]).toMatch(/id,siteId,title,location,startTime,endTime,requiredEmployees,status,createdAt,updatedAt/);
  });
});
