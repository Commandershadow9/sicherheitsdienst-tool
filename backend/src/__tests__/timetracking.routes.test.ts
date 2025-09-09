import request from 'supertest';
import app from '../app';

// Prisma global mock
jest.mock('@prisma/client', () => {
  (global as any).prismaMock = (global as any).prismaMock || {
    timeEntry: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    shiftAssignment: { findUnique: jest.fn() },
  };
  return { PrismaClient: jest.fn(() => (global as any).prismaMock) };
});

// Auth mock: authentifiziert als EMPLOYEE
jest.mock('../middleware/auth', () => ({
  authenticate: (_req: any, _res: any, next: any) => {
    _req.user = { id: 'u1', role: 'EMPLOYEE' };
    next();
  },
  authorize: () => (_req: any, _res: any, next: any) => next(),
  authorizeSelfOr: () => (_req: any, _res: any, next: any) => next(),
}));

describe('TimeTracking routes', () => {
  beforeEach(() => {
    const pm = (global as any).prismaMock;
    pm.timeEntry.findFirst.mockReset();
    pm.timeEntry.create.mockReset();
    pm.timeEntry.update.mockReset();
    pm.shiftAssignment.findUnique.mockReset();
  });

  it('clock-in ok', async () => {
    const pm = (global as any).prismaMock;
    pm.shiftAssignment.findUnique.mockResolvedValueOnce({ id: 'a1' });
    pm.timeEntry.findFirst.mockResolvedValueOnce(null);
    pm.timeEntry.create.mockResolvedValueOnce({ id: 't1', userId: 'u1', shiftId: 's1', startTime: '2024-09-01T10:00:00Z' });
    const res = await request(app).post('/api/shifts/s1/clock-in').send({ at: '2024-09-01T10:00:00Z' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('clock-in duplicate open entry', async () => {
    const pm = (global as any).prismaMock;
    pm.shiftAssignment.findUnique.mockResolvedValueOnce({ id: 'a1' });
    pm.timeEntry.findFirst.mockResolvedValueOnce({ id: 'open1' });
    const res = await request(app).post('/api/shifts/s1/clock-in').send({ at: '2024-09-01T10:00:00Z' });
    expect(res.status).toBe(400);
  });

  it('clock-in forbidden (not assigned)', async () => {
    const pm = (global as any).prismaMock;
    pm.shiftAssignment.findUnique.mockResolvedValueOnce(null);
    const res = await request(app).post('/api/shifts/s1/clock-in').send({ at: '2024-09-01T10:00:00Z' });
    expect(res.status).toBe(403);
  });

  it('clock-out ok', async () => {
    const pm = (global as any).prismaMock;
    pm.shiftAssignment.findUnique.mockResolvedValueOnce({ id: 'a1' });
    pm.timeEntry.findFirst.mockResolvedValueOnce({ id: 't1', startTime: '2024-09-01T10:00:00Z' });
    pm.timeEntry.update.mockResolvedValueOnce({ id: 't1', startTime: '2024-09-01T10:00:00Z', endTime: '2024-09-01T18:00:00Z', breakTime: 30 });
    const res = await request(app).post('/api/shifts/s1/clock-out').send({ at: '2024-09-01T18:00:00Z', breakTime: 30 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.warnings)).toBe(true);
  });

  it('clock-out no open entry (duplicate end)', async () => {
    const pm = (global as any).prismaMock;
    pm.shiftAssignment.findUnique.mockResolvedValueOnce({ id: 'a1' });
    pm.timeEntry.findFirst.mockResolvedValueOnce(null);
    const res = await request(app).post('/api/shifts/s1/clock-out').send({ at: '2024-09-01T18:00:00Z' });
    expect(res.status).toBe(400);
  });
});

// Hinweis: Unauthorized-Fälle werden separat in Auth-Middleware-Tests abgedeckt.
