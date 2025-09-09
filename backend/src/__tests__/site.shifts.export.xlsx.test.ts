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
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'sh1', siteId: 's1', title: 'T', location: 'Loc', startTime: new Date('2024-09-01T22:00:00Z'), endTime: new Date('2024-09-02T06:00:00Z'), requiredEmployees: 2, status: 'PLANNED', createdAt: new Date(), updatedAt: new Date(),
        },
      ]),
    },
  };
  return { PrismaClient: jest.fn(() => (global as any).prismaMock) };
});

describe('GET /api/sites/:siteId/shifts XLSX export', () => {
  it('returns XLSX when Accept xlsx is sent', async () => {
    const toBuffer = (res: any, cb: any) => {
      const chunks: any[] = [];
      res.on('data', (c: any) => chunks.push(c));
      res.on('end', () => cb(null, Buffer.concat(chunks)));
    };
    const res = await request(app)
      .get('/api/sites/s1/shifts')
      .set('Accept', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .buffer(true)
      .parse(toBuffer as any);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/vnd.openxmlformats-officedocument.spreadsheetml.sheet/);
    const buf: Buffer = res.body as any;
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.slice(0, 2).toString('ascii')).toBe('PK');
  });
});
