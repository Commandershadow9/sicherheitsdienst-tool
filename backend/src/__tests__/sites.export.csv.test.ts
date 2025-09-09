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
    site: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([
        {
          id: 's1',
          name: 'HQ',
          address: 'A',
          city: 'B',
          postalCode: 'C',
          createdAt: new Date('2024-08-01T12:00:00Z'),
          updatedAt: new Date('2024-08-15T12:00:00Z'),
        },
      ]),
    },
  };
  return { PrismaClient: jest.fn(() => (global as any).prismaMock) };
});

describe('GET /api/sites CSV export', () => {
  it('returns CSV when Accept text/csv is sent', async () => {
    const res = await request(app).get('/api/sites?page=1&pageSize=1').set('Accept', 'text/csv');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text.split('\n')[0]).toMatch(/id,name,address,city,postalCode,createdAt,updatedAt/);
  });
});
