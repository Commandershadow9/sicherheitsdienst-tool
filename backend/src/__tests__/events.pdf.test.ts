import request from 'supertest';
import app from '../app';

jest.mock('../middleware/auth', () => ({
  authenticate: (_req: any, _res: any, next: any) => { _req.user = { id: 'u1' }; next(); },
  authorize: () => (_req: any, _res: any, next: any) => next(),
  authorizeSelfOr: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock('@prisma/client', () => {
  (global as any).prismaMock = (global as any).prismaMock || {
    event: {
      findUnique: jest.fn().mockResolvedValue({ id: 'e1', title: 'Messe', startTime: new Date('2024-09-01T08:00:00Z'), endTime: new Date('2024-09-01T18:00:00Z'), siteId: 's1', serviceInstructions: 'Anweisungen', status: 'PLANNED' })
    }
  };
  return { PrismaClient: jest.fn(() => (global as any).prismaMock) };
});

describe('Event PDF export', () => {
  it('returns application/pdf when Accept pdf sent', async () => {
    const res = await request(app).get('/api/events/e1').set('Accept', 'application/pdf');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    const buf: Buffer = res.body as any;
    expect(Buffer.isBuffer(buf)).toBe(true);
    // PDF header
    expect(buf.slice(0, 4).toString('ascii')).toBe('%PDF');
  });
});
