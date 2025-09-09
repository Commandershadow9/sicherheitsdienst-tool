import request from 'supertest';
import app from '../app';

// Auth mocks
jest.mock('../middleware/auth', () => ({
  authenticate: (_req: any, _res: any, next: any) => {
    _req.user = { id: 'u1', role: 'ADMIN', isActive: true };
    next();
  },
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

// Prisma mock
jest.mock('@prisma/client', () => {
  (global as any).prismaMock = (global as any).prismaMock || {
    event: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([
        { id: 'e1', title: 'Messe', description: null, siteId: 's1', startTime: new Date('2024-09-01T08:00:00Z'), endTime: new Date('2024-09-01T18:00:00Z'), serviceInstructions: 'Treffpunkt...', assignedEmployeeIds: [], status: 'PLANNED', createdAt: new Date(), updatedAt: new Date() },
      ]),
      create: jest.fn().mockResolvedValue({ id: 'e1' }),
      findUnique: jest.fn().mockResolvedValue({ id: 'e1' }),
      update: jest.fn().mockResolvedValue({ id: 'e1' }),
      delete: jest.fn().mockResolvedValue({ id: 'e1' }),
    },
    user: {
      findMany: jest.fn().mockResolvedValue([{ id: 'u2' }]),
    },
  };
  return { PrismaClient: jest.fn(() => (global as any).prismaMock) };
});

describe('Events routes', () => {
  it('GET /api/events (JSON)', async () => {
    const res = await request(app).get('/api/events?page=1&pageSize=1');
    expect(res.status).toBe(200);
  });

  it('GET /api/events (CSV)', async () => {
    const res = await request(app).get('/api/events').set('Accept', 'text/csv');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
  });

  it('POST /api/events', async () => {
    const payload = { title: 'X', startTime: '2024-09-01T08:00:00Z', endTime: '2024-09-01T18:00:00Z', serviceInstructions: 'Text', assignedEmployeeIds: ['u2'] };
    const res = await request(app).post('/api/events').send(payload);
    expect(res.status).toBe(201);
  });
});

