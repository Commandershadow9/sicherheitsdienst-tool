/**
 * Unit-Tests für Shift Auto-Fill Service
 * Tests für automatische Schichtzuweisung mit Smart-Matching
 */

import { autoFillShifts, previewAutoFill } from '../services/shiftAutoFillService';
import { prisma } from '../lib/db';

jest.mock('../lib/db', () => ({
  prisma: {
    shift: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    shiftAssignment: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../services/shiftService', () => ({
  findReplacementCandidatesForShiftV2: jest.fn(),
}));

import { findReplacementCandidatesForShiftV2 } from '../services/shiftService';

describe('ShiftAutoFillService - autoFillShifts', () => {
  const mockStartDate = new Date('2025-01-10T00:00:00Z');
  const mockEndDate = new Date('2025-01-17T00:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should auto-fill understaffed shift with best candidate', async () => {
    const mockShift = {
      id: 'shift1',
      title: 'Nachtwache',
      siteId: 'site1',
      startTime: new Date('2025-01-10T22:00:00Z'),
      endTime: new Date('2025-01-11T06:00:00Z'),
      requiredEmployees: 2,
      requiredQualifications: [],
      assignments: [
        { id: 'a1', userId: 'user1' },
      ],
    };

    const mockCandidates = [
      {
        id: 'user2',
        firstName: 'Max',
        lastName: 'Mustermann',
        employeeId: 'EMP002',
        hasRequiredQualifications: true,
        missingQualifications: [],
        siteAccessStatus: 'CLEARED' as const,
        isAvailable: true,
        score: {
          total: 95,
          recommendation: 'OPTIMAL' as const,
          color: 'green' as const,
          workload: 100,
          compliance: 100,
          fairness: 90,
          preference: 90,
        },
        metrics: {
          currentHours: 30,
          targetHours: 40,
          utilizationPercent: 75,
          restHours: 12,
          weeklyHours: 30,
          consecutiveDays: 3,
          nightShiftCount: 2,
          avgNightShiftCount: 2.5,
          replacementCount: 1,
          avgReplacementCount: 1.2,
        },
        warnings: [],
      },
    ];

    (prisma.shift.findMany as jest.Mock).mockResolvedValue([mockShift]);
    (findReplacementCandidatesForShiftV2 as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        shiftId: 'shift1',
        candidates: mockCandidates,
        stats: { total: 1, optimal: 1, good: 0, acceptable: 0, notRecommended: 0 },
      },
    });
    (prisma.shiftAssignment.create as jest.Mock).mockResolvedValue({
      id: 'a2',
      userId: 'user2',
      shiftId: 'shift1',
    });

    const result = await autoFillShifts({
      startDate: mockStartDate,
      endDate: mockEndDate,
      maxCandidatesPerShift: 1,
    });

    expect(result).toHaveLength(1);
    expect(result[0].shiftId).toBe('shift1');
    expect(result[0].status).toBe('FILLED');
    expect(result[0].assignedUsers).toHaveLength(1);
    expect(result[0].assignedUsers[0].userId).toBe('user2');
    expect(prisma.shiftAssignment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user2',
          shiftId: 'shift1',
        }),
      })
    );
  });

  it('should mark shift as PARTIAL when not fully staffed', async () => {
    const mockShift = {
      id: 'shift2',
      title: 'Tagschicht',
      siteId: 'site1',
      startTime: new Date('2025-01-11T08:00:00Z'),
      endTime: new Date('2025-01-11T16:00:00Z'),
      requiredEmployees: 3,
      requiredQualifications: [],
      assignments: [],
    };

    const mockCandidates = [
      {
        id: 'user1',
        firstName: 'Anna',
        lastName: 'Schmidt',
        employeeId: 'EMP001',
        hasRequiredQualifications: true,
        missingQualifications: [],
        siteAccessStatus: 'CLEARED' as const,
        isAvailable: true,
        score: {
          total: 85,
          recommendation: 'GOOD' as const,
          color: 'yellow' as const,
          workload: 80,
          compliance: 100,
          fairness: 80,
          preference: 80,
        },
        metrics: {
          currentHours: 38,
          targetHours: 40,
          utilizationPercent: 95,
          restHours: 14,
          weeklyHours: 38,
          consecutiveDays: 4,
          nightShiftCount: 1,
          avgNightShiftCount: 1.5,
          replacementCount: 0,
          avgReplacementCount: 0.5,
        },
        warnings: [],
      },
    ];

    (prisma.shift.findMany as jest.Mock).mockResolvedValue([mockShift]);
    (findReplacementCandidatesForShiftV2 as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        shiftId: 'shift2',
        candidates: mockCandidates,
        stats: { total: 1, optimal: 0, good: 1, acceptable: 0, notRecommended: 0 },
      },
    });
    (prisma.shiftAssignment.create as jest.Mock).mockResolvedValue({
      id: 'a1',
      userId: 'user1',
      shiftId: 'shift2',
    });

    const result = await autoFillShifts({
      startDate: mockStartDate,
      endDate: mockEndDate,
      maxCandidatesPerShift: 10,
    });

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('PARTIAL');
    expect(result[0].assignedUsers).toHaveLength(1);
    expect(result[0].staffingLevel).toBe('1/3');
  });

  it('should mark shift as UNFILLED when no candidates available', async () => {
    const mockShift = {
      id: 'shift3',
      title: 'Spezialeinsatz',
      siteId: 'site2',
      startTime: new Date('2025-01-12T10:00:00Z'),
      endTime: new Date('2025-01-12T18:00:00Z'),
      requiredEmployees: 1,
      requiredQualifications: ['Waffenschein', 'Erste Hilfe'],
      assignments: [],
    };

    (prisma.shift.findMany as jest.Mock).mockResolvedValue([mockShift]);
    (findReplacementCandidatesForShiftV2 as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        shiftId: 'shift3',
        candidates: [],
        stats: { total: 0, optimal: 0, good: 0, acceptable: 0, notRecommended: 0 },
      },
    });

    const result = await autoFillShifts({
      startDate: mockStartDate,
      endDate: mockEndDate,
      maxCandidatesPerShift: 5,
    });

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('UNFILLED');
    expect(result[0].assignedUsers).toHaveLength(0);
    expect(result[0].reason).toBe('Keine geeigneten Kandidaten gefunden');
  });

  it('should respect minScore threshold', async () => {
    const mockShift = {
      id: 'shift4',
      title: 'Bewachung',
      siteId: 'site1',
      startTime: new Date('2025-01-13T14:00:00Z'),
      endTime: new Date('2025-01-13T22:00:00Z'),
      requiredEmployees: 1,
      requiredQualifications: [],
      assignments: [],
    };

    const mockCandidates = [
      {
        id: 'user3',
        firstName: 'Tom',
        lastName: 'Müller',
        employeeId: 'EMP003',
        hasRequiredQualifications: true,
        missingQualifications: [],
        siteAccessStatus: 'CLEARED' as const,
        isAvailable: true,
        score: {
          total: 45, // Unter dem Schwellenwert
          recommendation: 'NOT_RECOMMENDED' as const,
          color: 'red' as const,
          workload: 40,
          compliance: 50,
          fairness: 40,
          preference: 50,
        },
        metrics: {
          currentHours: 42,
          targetHours: 40,
          utilizationPercent: 105,
          restHours: 8,
          weeklyHours: 42,
          consecutiveDays: 6,
          nightShiftCount: 4,
          avgNightShiftCount: 2.0,
          replacementCount: 3,
          avgReplacementCount: 1.0,
        },
        warnings: [{ type: 'WORKLOAD', severity: 'warning' as const, message: 'Überlastung' }],
      },
    ];

    (prisma.shift.findMany as jest.Mock).mockResolvedValue([mockShift]);
    (findReplacementCandidatesForShiftV2 as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        shiftId: 'shift4',
        candidates: mockCandidates,
        stats: { total: 1, optimal: 0, good: 0, acceptable: 0, notRecommended: 1 },
      },
    });

    const result = await autoFillShifts({
      startDate: mockStartDate,
      endDate: mockEndDate,
      minScore: 60, // Schwellenwert 60
      maxCandidatesPerShift: 5,
    });

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('UNFILLED');
    expect(result[0].assignedUsers).toHaveLength(0);
    expect(result[0].reason).toContain('Score zu niedrig');
  });

  it('should handle previewAutoFill without creating assignments', async () => {
    const mockShift = {
      id: 'shift5',
      title: 'Preview Test',
      siteId: 'site1',
      startTime: new Date('2025-01-14T08:00:00Z'),
      endTime: new Date('2025-01-14T16:00:00Z'),
      requiredEmployees: 1,
      requiredQualifications: [],
      assignments: [],
    };

    const mockCandidates = [
      {
        id: 'user4',
        firstName: 'Lisa',
        lastName: 'Wagner',
        employeeId: 'EMP004',
        hasRequiredQualifications: true,
        missingQualifications: [],
        siteAccessStatus: 'CLEARED' as const,
        isAvailable: true,
        score: {
          total: 90,
          recommendation: 'OPTIMAL' as const,
          color: 'green' as const,
          workload: 90,
          compliance: 100,
          fairness: 85,
          preference: 85,
        },
        metrics: {
          currentHours: 32,
          targetHours: 40,
          utilizationPercent: 80,
          restHours: 16,
          weeklyHours: 32,
          consecutiveDays: 3,
          nightShiftCount: 1,
          avgNightShiftCount: 1.5,
          replacementCount: 1,
          avgReplacementCount: 1.0,
        },
        warnings: [],
      },
    ];

    (prisma.shift.findMany as jest.Mock).mockResolvedValue([mockShift]);
    (findReplacementCandidatesForShiftV2 as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        shiftId: 'shift5',
        candidates: mockCandidates,
        stats: { total: 1, optimal: 1, good: 0, acceptable: 0, notRecommended: 0 },
      },
    });

    const result = await previewAutoFill({
      startDate: mockStartDate,
      endDate: mockEndDate,
      maxCandidatesPerShift: 1,
    });

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('FILLED');
    expect(prisma.shiftAssignment.create).not.toHaveBeenCalled(); // Kein Create bei Preview
  });

  it('should filter by siteId when provided', async () => {
    (prisma.shift.findMany as jest.Mock).mockResolvedValue([]);

    await autoFillShifts({
      startDate: mockStartDate,
      endDate: mockEndDate,
      siteId: 'site1',
      maxCandidatesPerShift: 5,
    });

    expect(prisma.shift.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          siteId: 'site1',
        }),
      })
    );
  });
});
