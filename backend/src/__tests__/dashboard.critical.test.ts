import request from 'supertest';
jest.mock('@prisma/client', () => {
  (global as any).prismaMock =
    (global as any).prismaMock ||
    {
      shift: {
        findMany: jest.fn(),
      },
      absence: {
        findMany: jest.fn(),
      },
    };
  return {
    PrismaClient: jest.fn(() => (global as any).prismaMock),
    ShiftStatus: { PLANNED: 'PLANNED', ACTIVE: 'ACTIVE' },
    AbsenceStatus: { APPROVED: 'APPROVED' },
    AssignmentStatus: {
      ASSIGNED: 'ASSIGNED',
      CONFIRMED: 'CONFIRMED',
      STARTED: 'STARTED',
    },
  };
});

jest.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 'manager-1', role: 'MANAGER' };
    return next();
  },
  authorize: () => (_req: any, _res: any, next: any) => next(),
  authorizeSelfOr: () => (_req: any, _res: any, next: any) => next(),
}));

import app from '../app';

describe('Dashboard critical shifts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns shortage metrics including coverage fields', async () => {
    const startTime = new Date();
    startTime.setHours(9, 0, 0, 0);
    const endTime = new Date(startTime.getTime() + 4 * 60 * 60 * 1000);

    (global as any).prismaMock.shift.findMany.mockResolvedValueOnce([
      {
        id: 'shift-1',
        title: 'Tagdienst HQ',
        startTime,
        endTime,
        requiredEmployees: 2,
        site: { id: 'site-1', name: 'HQ' },
        assignments: [
          { userId: 'user-1', user: { firstName: 'Jane', lastName: 'Doe' } },
          { userId: 'user-2', user: { firstName: 'John', lastName: 'Smith' } },
          { userId: 'user-3', user: { firstName: 'Alex', lastName: 'Miller' } },
        ],
      },
    ]);

    (global as any).prismaMock.absence.findMany.mockResolvedValueOnce([
      {
        id: 'absence-1',
        userId: 'user-1',
        type: 'SICKNESS',
        user: { id: 'user-1', firstName: 'Jane', lastName: 'Doe' },
      },
      {
        id: 'absence-2',
        userId: 'user-2',
        type: 'VACATION',
        user: { id: 'user-2', firstName: 'John', lastName: 'Smith' },
      },
    ]);

    const res = await request(app).get('/api/dashboard/critical');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
    const critical = res.body.data[0];
    expect(critical).toMatchObject({
      shiftId: 'shift-1',
      shiftTitle: 'Tagdienst HQ',
      siteName: 'HQ',
      requiredEmployees: 2,
      availableEmployees: 1,
      shortage: 1,
      assignedEmployees: 3,
      absentEmployees: 2,
      coveredAbsences: 1,
      coverageBufferBeforeAbsences: 1,
    });
    expect(critical.reasons).toEqual([
      { employeeName: 'Jane Doe', reason: 'Krankmeldung' },
      { employeeName: 'John Smith', reason: 'Urlaub' },
    ]);
  });
});
