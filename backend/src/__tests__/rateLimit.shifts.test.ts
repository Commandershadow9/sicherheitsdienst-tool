import request from 'supertest';
import app from '../app';

// Dynamic auth mock so tests can switch between roles
jest.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    const fallbackUser = { id: 'admin', role: 'ADMIN', isActive: true };
    req.user = (global as any).__testUser || fallbackUser;
    next();
  },
  authorize: () => (_req: any, _res: any, next: any) => next(),
  authorizeSelfOr: () => (_req: any, _res: any, next: any) => next(),
}));

// Shared Prisma mock
jest.mock('@prisma/client', () => {
  (global as any).shiftPrismaMock = (global as any).shiftPrismaMock || {
    shift: { findUnique: jest.fn() },
    shiftAssignment: { findUnique: jest.fn(), create: jest.fn() },
    timeEntry: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  };
  return { PrismaClient: jest.fn(() => (global as any).shiftPrismaMock) };
});

describe('Shift-specific rate limits', () => {
  const pm = (global as any).shiftPrismaMock;

  beforeEach(() => {
    pm.shift.findUnique.mockReset();
    pm.shiftAssignment.findUnique.mockReset();
    pm.shiftAssignment.create.mockReset();
    pm.timeEntry.findFirst.mockReset();
    pm.timeEntry.create.mockReset();
    pm.timeEntry.update.mockReset();
    delete (global as any).__testUser;
  });

  describe('assignment limiter', () => {
    beforeAll(() => {
      process.env.SHIFT_ASSIGN_RATE_LIMIT_ENABLED = 'true';
      process.env.SHIFT_ASSIGN_RATE_LIMIT_PER_MIN = '1';
      process.env.SHIFT_ASSIGN_RATE_LIMIT_WINDOW_MS = '60000';
    });

    afterAll(() => {
      delete (process.env as any).SHIFT_ASSIGN_RATE_LIMIT_ENABLED;
      delete (process.env as any).SHIFT_ASSIGN_RATE_LIMIT_PER_MIN;
      delete (process.env as any).SHIFT_ASSIGN_RATE_LIMIT_WINDOW_MS;
    });

    it('limits repeated shift assignments for the same actor', async () => {
      pm.shift.findUnique.mockResolvedValue({ id: 's1', assignments: [] });
      pm.shiftAssignment.findUnique.mockResolvedValue(null);
      pm.shiftAssignment.create.mockResolvedValue({
        id: 'assign-1',
        userId: 'u-worker',
        shiftId: 's1',
        status: 'ASSIGNED',
      });
      (global as any).__testUser = { id: 'admin-assign', role: 'ADMIN', isActive: true };

      const payload = { userId: 'u-worker' };
      const first = await request(app).post('/api/shifts/s1/assign').send(payload);
      expect(first.status).toBe(201);
      const second = await request(app).post('/api/shifts/s1/assign').send(payload);
      expect(second.status).toBe(429);
      expect(second.body).toMatchObject({ success: false, code: 'TOO_MANY_REQUESTS' });
      expect(pm.shiftAssignment.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('clock limiter', () => {
    beforeAll(() => {
      process.env.SHIFT_CLOCK_RATE_LIMIT_ENABLED = 'true';
      process.env.SHIFT_CLOCK_RATE_LIMIT_PER_MIN = '1';
      process.env.SHIFT_CLOCK_RATE_LIMIT_WINDOW_MS = '60000';
    });

    afterAll(() => {
      delete (process.env as any).SHIFT_CLOCK_RATE_LIMIT_ENABLED;
      delete (process.env as any).SHIFT_CLOCK_RATE_LIMIT_PER_MIN;
      delete (process.env as any).SHIFT_CLOCK_RATE_LIMIT_WINDOW_MS;
    });

    it('limits rapid clock-in attempts by the same employee', async () => {
      pm.shiftAssignment.findUnique.mockResolvedValue({ userId: 'emp-1', shiftId: 's1' });
      pm.timeEntry.findFirst.mockResolvedValueOnce(null); // open entry
      pm.timeEntry.create.mockResolvedValueOnce({
        id: 'time-1',
        userId: 'emp-1',
        shiftId: 's1',
        startTime: new Date('2025-09-01T08:00:00Z'),
      });
      pm.timeEntry.findFirst.mockResolvedValueOnce(null); // last finished entry
      (global as any).__testUser = { id: 'emp-1', role: 'EMPLOYEE', isActive: true };

      const first = await request(app)
        .post('/api/shifts/s1/clock-in')
        .send({ at: '2025-09-01T08:00:00Z' });
      expect(first.status).toBe(200);

      const second = await request(app)
        .post('/api/shifts/s1/clock-in')
        .send({ at: '2025-09-01T08:01:00Z' });
      expect(second.status).toBe(429);
      expect(second.body).toMatchObject({ success: false, code: 'TOO_MANY_REQUESTS' });
      expect(pm.timeEntry.create).toHaveBeenCalledTimes(1);
    });

    it('limits rapid clock-out attempts by the same employee', async () => {
      pm.shiftAssignment.findUnique.mockResolvedValue({ userId: 'emp-2', shiftId: 's1' });
      pm.timeEntry.findFirst.mockResolvedValueOnce({
        id: 'time-open',
        userId: 'emp-2',
        shiftId: 's1',
        startTime: new Date('2025-09-01T08:00:00Z'),
        endTime: null,
      });
      pm.timeEntry.update.mockResolvedValueOnce({
        id: 'time-open',
        userId: 'emp-2',
        shiftId: 's1',
        startTime: new Date('2025-09-01T08:00:00Z'),
        endTime: new Date('2025-09-01T16:00:00Z'),
        breakTime: 0,
      });
      (global as any).__testUser = { id: 'emp-2', role: 'EMPLOYEE', isActive: true };

      const first = await request(app)
        .post('/api/shifts/s1/clock-out')
        .send({ at: '2025-09-01T16:00:00Z', breakTime: 0 });
      expect(first.status).toBe(200);

      const second = await request(app)
        .post('/api/shifts/s1/clock-out')
        .send({ at: '2025-09-01T16:05:00Z', breakTime: 0 });
      expect(second.status).toBe(429);
      expect(second.body).toMatchObject({ success: false, code: 'TOO_MANY_REQUESTS' });
      expect(pm.timeEntry.update).toHaveBeenCalledTimes(1);
    });
  });
});
