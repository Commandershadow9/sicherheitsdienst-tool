import request from 'supertest';
import app from '../app';

jest.mock('@prisma/client', () => {
  (global as any).prismaMock = (global as any).prismaMock || {
    shift: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    shiftAssignment: {
      deleteMany: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => (global as any).prismaMock) };
});

// Auth-/Authorize-Middleware für Tests durchreichen
jest.mock('../middleware/auth', () => ({
  authenticate: (_req: any, _res: any, next: any) => next(),
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

describe('Shifts Routes (basic)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/shifts → 201', async () => {
    const payload = {
      title: 'Frühschicht',
      location: 'HQ',
      startTime: '2024-09-02T08:00:00Z',
      endTime: '2024-09-02T12:00:00Z',
    };
    (global as any).prismaMock.shift.create.mockResolvedValueOnce({ id: 'sh1', ...payload, assignments: [] });
    const res = await request(app).post('/api/shifts').send(payload);
    expect(res.status).toBe(201);
  });

  it('POST /api/shifts → 422 bei invalid (Zod)', async () => {
    const res = await request(app).post('/api/shifts').send({ title: '' });
    expect(res.status).toBe(422);
  });

  it('PUT /api/shifts/:id → 200', async () => {
    (global as any).prismaMock.shift.update.mockResolvedValueOnce({ id: 'sh1', title: 'Neu', assignments: [] });
    const res = await request(app).put('/api/shifts/sh1').send({ title: 'Neu' });
    expect(res.status).toBe(200);
  });

  it('PUT /api/shifts/:id → 404 (P2025)', async () => {
    (global as any).prismaMock.shift.update.mockRejectedValueOnce({ code: 'P2025' });
    const res = await request(app).put('/api/shifts/404').send({ title: 'Neu' });
    expect(res.status).toBe(404);
  });

  it('DELETE /api/shifts/:id → 200', async () => {
    (global as any).prismaMock.shift.findUnique.mockResolvedValueOnce({ id: 'sh1', title: 'T', assignments: [] });
    (global as any).prismaMock.shiftAssignment.deleteMany.mockResolvedValueOnce({ count: 0 });
    (global as any).prismaMock.shift.delete.mockResolvedValueOnce({ id: 'sh1', title: 'T' });
    const res = await request(app).delete('/api/shifts/sh1');
    expect(res.status).toBe(200);
  });

  it('DELETE /api/shifts/:id → 404 (P2025)', async () => {
    (global as any).prismaMock.shiftAssignment.deleteMany.mockResolvedValueOnce({ count: 0 });
    (global as any).prismaMock.shift.delete.mockRejectedValueOnce({ code: 'P2025' });
    const res = await request(app).delete('/api/shifts/404');
    expect(res.status).toBe(404);
  });
});
