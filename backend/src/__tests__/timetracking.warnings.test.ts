import request from 'supertest';
import app from '../app';

// Mock auth: inject authenticated user
jest.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => { req.user = { id: 'u1', role: 'EMPLOYEE', isActive: true }; next(); },
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

// Mock Prisma
jest.mock('@prisma/client', () => {
  (global as any).pm = (global as any).pm || {
    shiftAssignment: { findUnique: jest.fn() },
    timeEntry: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  };
  return { PrismaClient: jest.fn(() => (global as any).pm) };
});

describe('TimeTracking warnings', () => {
  beforeEach(() => {
    const pm = (global as any).pm;
    pm.shiftAssignment.findUnique.mockReset();
    pm.timeEntry.findFirst.mockReset();
    pm.timeEntry.create.mockReset();
    pm.timeEntry.update.mockReset();
    pm.shiftAssignment.findUnique.mockResolvedValue({ userId: 'u1', shiftId: 's1' });
  });

  it('clock-in warns when rest period < 11h', async () => {
    const pm = (global as any).pm;
    const lastEnd = new Date('2024-09-01T12:00:00Z');
    const at = new Date('2024-09-01T20:00:00Z'); // 8h later → warn
    pm.timeEntry.findFirst.mockResolvedValueOnce(null); // open entry check
    pm.timeEntry.create.mockResolvedValueOnce({ id: 't1', userId: 'u1', shiftId: 's1', startTime: at });
    pm.timeEntry.findFirst.mockResolvedValueOnce({ endTime: lastEnd }); // last finished entry
    const res = await request(app).post('/api/shifts/s1/clock-in').send({ at: at.toISOString() });
    expect(res.status).toBe(200);
    expect(res.body.warnings).toContain('WARN_REST_PERIOD_LT_11H');
  });

  it('clock-out warns when duration > 10h and > 12h', async () => {
    const pm = (global as any).pm;
    const start = new Date('2024-09-01T06:00:00Z');
    const end = new Date('2024-09-01T19:00:00Z'); // 13h → >12h and >10h
    pm.timeEntry.findFirst.mockResolvedValueOnce({ id: 't1', userId: 'u1', shiftId: 's1', startTime: start, endTime: null });
    pm.timeEntry.update.mockResolvedValueOnce({ id: 't1', userId: 'u1', startTime: start, endTime: end, breakTime: 0 });
    const res = await request(app).post('/api/shifts/s1/clock-out').send({ at: end.toISOString(), breakTime: 0 });
    expect(res.status).toBe(200);
    expect(res.body.warnings).toEqual(expect.arrayContaining(['WARN_SHIFT_GT_10H', 'WARN_SHIFT_GT_12H']));
  });
});

