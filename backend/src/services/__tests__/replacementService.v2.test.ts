import { performance } from 'perf_hooks';
import { findReplacementCandidatesForShiftV2 } from '../replacementService';

const mockCalculateCandidateScore = jest.fn();

jest.mock('@prisma/client', () => {
  (global as any).prismaMock =
    (global as any).prismaMock ||
    {
      shift: {
        findUnique: jest.fn(),
      },
      absence: {
        findMany: jest.fn(),
      },
      objectClearance: {
        findMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      shiftAssignment: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      employeeWorkload: {
        findMany: jest.fn(),
      },
    };
  return { PrismaClient: jest.fn(() => (global as any).prismaMock) };
});

jest.mock('../intelligentReplacementService', () => ({
  calculateCandidateScore: (...args: unknown[]) => mockCalculateCandidateScore(...args),
}));

describe('findReplacementCandidatesForShiftV2', () => {
  const baseShift = {
    id: 'shift-1',
    siteId: 'site-1',
    title: 'Test-Schicht',
    startTime: new Date('2025-10-06T08:00:00Z'),
    endTime: new Date('2025-10-06T16:00:00Z'),
    requiredQualifications: [],
    assignments: [],
  };

  const candidateScore = (userId: string, total: number) => ({
    userId,
    totalScore: total,
    recommendation: total >= 80 ? 'OPTIMAL' : total >= 60 ? 'GOOD' : 'ACCEPTABLE',
    color: total >= 80 ? 'green' : total >= 60 ? 'yellow' : 'orange',
    workloadScore: 75,
    complianceScore: 90,
    fairnessScore: 70,
    preferenceScore: 80,
    metrics: {
      currentMonthHours: 120,
      targetMonthHours: 160,
      utilizationPercent: 75,
      maxWeeklyHours: 42,
      lastShiftEnd: new Date('2025-10-05T16:00:00Z'),
      nextShiftStart: new Date('2025-10-06T08:00:00Z'),
      restHours: 14,
      restHoursRequired: 11,
      restHoursOK: true,
      consecutiveDaysWorked: 3,
      restDaysLast14Days: 11,
      nightShiftsThisMonth: 2,
      teamAverageNightShifts: 3,
      replacementCount: 1,
      teamAverageReplacementCount: 0.6,
      preferenceMatch: {
        shiftType: 'MATCH',
        shiftDuration: 'MATCH',
        workloadLevel: 'MATCH',
      },
    },
    warnings: [],
  });

  beforeEach(() => {
    jest.clearAllMocks();

  (global as any).prismaMock.shift.findUnique.mockReset();
  (global as any).prismaMock.absence.findMany.mockReset();
  (global as any).prismaMock.objectClearance.findMany.mockReset();
  (global as any).prismaMock.user.findUnique.mockReset();
  (global as any).prismaMock.shiftAssignment.findMany.mockReset();
  (global as any).prismaMock.shiftAssignment.findFirst.mockReset();
  (global as any).prismaMock.employeeWorkload.findMany.mockReset();

  (global as any).prismaMock.shift.findUnique.mockResolvedValue({
    ...baseShift,
    assignments: [],
  });

    (global as any).prismaMock.absence.findMany
      .mockResolvedValueOnce([]) // APPROVED absences
      .mockResolvedValueOnce([
        {
          userId: 'candidate-b',
          type: 'VACATION',
          startsAt: new Date('2025-10-05T00:00:00Z'),
          endsAt: new Date('2025-10-07T00:00:00Z'),
        },
      ]); // REQUESTED absences

    (global as any).prismaMock.objectClearance.findMany.mockResolvedValue([
      {
        userId: 'candidate-a',
        status: 'ACTIVE',
        trainedAt: new Date('2025-09-01T00:00:00Z'),
        validUntil: null,
        user: {
          id: 'candidate-a',
          firstName: 'Alice',
          lastName: 'Anders',
          email: 'alice@example.com',
        },
      },
      {
        userId: 'candidate-b',
        status: 'ACTIVE',
        trainedAt: new Date('2025-09-01T00:00:00Z'),
        validUntil: null,
        user: {
          id: 'candidate-b',
          firstName: 'Bob',
          lastName: 'Bauer',
          email: 'bob@example.com',
        },
      },
    ]);

    mockCalculateCandidateScore.mockReset();
    mockCalculateCandidateScore.mockImplementation((userId: string) => {
      if (userId === 'candidate-a') {
        return candidateScore('candidate-a', 88);
      }
      return candidateScore('candidate-b', 62);
    });
  });

  it('liefert sortierte Kandidatenliste mit Pending-Absence-Warnung', async () => {
    const result = await findReplacementCandidatesForShiftV2('shift-1');

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('candidate-a');
    expect(result[0].score.total).toBe(88);

    expect(result[1].id).toBe('candidate-b');
    expect(result[1].warnings[0]).toEqual(
      expect.objectContaining({
        type: 'PENDING_ABSENCE_REQUEST',
        severity: 'warning',
      }),
    );

    expect(result[0].metrics.weeklyHours).toBe(42);
    expect(result[0].metrics.replacementCount).toBe(1);
  });

  it('filtert optional abwesenden Nutzer aus', async () => {
    const result = await findReplacementCandidatesForShiftV2('shift-1', 'candidate-a');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('candidate-b');
  });

  it('bearbeitet 50 Kandidaten unter 500ms', async () => {
    const now = new Date('2025-10-06T08:00:00Z');
    const bulkCandidates = Array.from({ length: 50 }).map((_, index) => ({
      userId: `candidate-${index}`,
      status: 'ACTIVE',
      trainedAt: now,
      validUntil: null,
      user: {
        id: `candidate-${index}`,
        firstName: `User${index}`,
        lastName: 'Speed',
        email: `user${index}@example.com`,
      },
    }));

    const shiftStart = baseShift.startTime;

    (global as any).prismaMock.shift.findUnique.mockResolvedValue({
      ...baseShift,
      assignments: [],
    });

    (global as any).prismaMock.absence.findMany.mockImplementation(({ where }: any) => {
      if (where?.status === 'APPROVED') {
        return Promise.resolve([]);
      }
      if (where?.status === 'REQUESTED') {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    (global as any).prismaMock.objectClearance.findMany.mockResolvedValue(bulkCandidates);

    (global as any).prismaMock.user.findUnique.mockImplementation(({ where }: any) =>
      Promise.resolve({
        id: where.id,
        firstName: `First${where.id}`,
        lastName: `Last${where.id}`,
        preferences: {
          id: `pref-${where.id}`,
          userId: where.id,
          prefersNightShifts: false,
          prefersDayShifts: true,
          prefersWeekends: false,
          targetMonthlyHours: 160,
          minMonthlyHours: 120,
          maxMonthlyHours: 200,
          flexibleHours: true,
          prefersLongShifts: false,
          prefersShortShifts: false,
          prefersConsecutiveDays: 5,
          minRestDaysPerWeek: 2,
          preferredSiteIds: [],
          avoidedSiteIds: [],
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }),
    );

    (global as any).prismaMock.shiftAssignment.findFirst.mockImplementation(() =>
      Promise.resolve({
        shift: {
          endTime: new Date(shiftStart.getTime() - 12 * 60 * 60 * 1000),
        },
      }),
    );

    (global as any).prismaMock.shiftAssignment.findMany.mockImplementation((args: any) => {
      if (args?.select?.assignedAt) {
        return Promise.resolve(
          bulkCandidates.map((candidate: any, index: number) => ({
            userId: candidate.userId,
            assignedAt: new Date(shiftStart.getTime() - (6 + index % 3) * 60 * 60 * 1000),
            shift: {
              startTime: new Date(shiftStart.getTime() - (index % 2) * 60 * 60 * 1000),
            },
          })),
        );
      }

      if (args?.include?.shift) {
        return Promise.resolve(
          [
            { shift: { startTime: new Date(shiftStart.getTime() - 48 * 60 * 60 * 1000), endTime: new Date(shiftStart.getTime() - 40 * 60 * 60 * 1000) } },
            { shift: { startTime: new Date(shiftStart.getTime() - 32 * 60 * 60 * 1000), endTime: new Date(shiftStart.getTime() - 24 * 60 * 60 * 1000) } },
            { shift: { startTime: new Date(shiftStart.getTime() - 16 * 60 * 60 * 1000), endTime: new Date(shiftStart.getTime() - 8 * 60 * 60 * 1000) } },
          ].map((entry) => ({
            ...entry,
            userId: args.where?.userId ?? 'candidate-mock',
          })),
        );
      }

      return Promise.resolve([]);
    });

    (global as any).prismaMock.employeeWorkload.findMany.mockResolvedValue(
      bulkCandidates.map((candidate: any) => ({
        userId: candidate.userId,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        totalHours: 120,
        nightShiftCount: 2,
      })),
    );

    const actualIntelligentService = jest.requireActual('../intelligentReplacementService');
    mockCalculateCandidateScore.mockImplementation((userId: string, shift: any) =>
      actualIntelligentService.calculateCandidateScore(userId, shift),
    );

    const start = performance.now();
    const result = await findReplacementCandidatesForShiftV2('shift-1');
    const duration = performance.now() - start;

    expect(result).toHaveLength(50);
    expect(duration).toBeLessThan(500);
  });
});
