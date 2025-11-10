/**
 * Unit-Tests für Shift Conflict Service
 * Tests für alle 9 Konflikttypen und Severity-Classification
 */

import { analyzeShiftConflicts } from '../services/shiftConflictService';
import { prisma } from '../lib/db';

jest.mock('../lib/db', () => ({
  prisma: {
    shift: {
      findMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    objectClearance: {
      findMany: jest.fn(),
    },
  },
}));

describe('ShiftConflictService - analyzeShiftConflicts', () => {
  const mockStartDate = new Date('2025-01-10T00:00:00Z');
  const mockEndDate = new Date('2025-01-17T00:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect UNDERSTAFFED conflict (CRITICAL)', async () => {
    (prisma.shift.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'shift1',
        title: 'Nachtwache',
        siteId: 'site1',
        startTime: new Date('2025-01-10T22:00:00Z'),
        endTime: new Date('2025-01-11T06:00:00Z'),
        requiredEmployees: 3,
        requiredQualifications: [],
        assignments: [
          { id: 'a1', userId: 'user1', user: { id: 'user1' } },
        ],
      },
    ]);

    const result = await analyzeShiftConflicts({
      startDate: mockStartDate,
      endDate: mockEndDate,
    });

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('UNDERSTAFFED');
    expect(result[0].severity).toBe('critical');
    expect(result[0].shift.id).toBe('shift1');
    expect(result[0].details).toContain('1/3');
  });

  it('should detect UNASSIGNED conflict (CRITICAL)', async () => {
    (prisma.shift.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'shift2',
        title: 'Tagschicht',
        siteId: 'site1',
        startTime: new Date('2025-01-11T08:00:00Z'),
        endTime: new Date('2025-01-11T16:00:00Z'),
        requiredEmployees: 2,
        requiredQualifications: [],
        assignments: [],
      },
    ]);

    const result = await analyzeShiftConflicts({
      startDate: mockStartDate,
      endDate: mockEndDate,
    });

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('UNASSIGNED');
    expect(result[0].severity).toBe('critical');
  });

  it('should detect NO_CLEARANCE conflict (HIGH)', async () => {
    (prisma.shift.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'shift3',
        title: 'Sicherheitsdienst',
        siteId: 'site1',
        startTime: new Date('2025-01-12T10:00:00Z'),
        endTime: new Date('2025-01-12T18:00:00Z'),
        requiredEmployees: 1,
        requiredQualifications: [],
        assignments: [
          {
            id: 'a1',
            userId: 'user1',
            user: {
              id: 'user1',
              objectClearances: [], // Keine Clearance
            },
          },
        ],
      },
    ]);

    (prisma.objectClearance.findMany as jest.Mock).mockResolvedValue([]);

    const result = await analyzeShiftConflicts({
      startDate: mockStartDate,
      endDate: mockEndDate,
    });

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('NO_CLEARANCE');
    expect(result[0].severity).toBe('high');
    expect(result[0].affected).toHaveLength(1);
  });

  it('should detect MISSING_QUALIFICATIONS conflict (HIGH)', async () => {
    (prisma.shift.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'shift4',
        title: 'Bewaffnete Wache',
        siteId: 'site1',
        startTime: new Date('2025-01-13T14:00:00Z'),
        endTime: new Date('2025-01-13T22:00:00Z'),
        requiredEmployees: 1,
        requiredQualifications: ['Waffenschein', 'Erste Hilfe'],
        assignments: [
          {
            id: 'a1',
            userId: 'user2',
            user: {
              id: 'user2',
              qualifications: ['Erste Hilfe'], // Waffenschein fehlt
              objectClearances: [{ siteId: 'site1', status: 'ACTIVE', validUntil: null }],
            },
          },
        ],
      },
    ]);

    (prisma.objectClearance.findMany as jest.Mock).mockResolvedValue([
      { userId: 'user2', siteId: 'site1', status: 'ACTIVE', validUntil: null },
    ]);

    const result = await analyzeShiftConflicts({
      startDate: mockStartDate,
      endDate: mockEndDate,
    });

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('MISSING_QUALIFICATIONS');
    expect(result[0].severity).toBe('high');
    expect(result[0].details).toContain('Waffenschein');
  });

  it('should detect DOUBLE_BOOKING conflict (HIGH)', async () => {
    const user1 = { id: 'user1', objectClearances: [{ siteId: 'site1', status: 'ACTIVE' }] };

    (prisma.shift.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'shift5',
        title: 'Schicht A',
        siteId: 'site1',
        startTime: new Date('2025-01-14T08:00:00Z'),
        endTime: new Date('2025-01-14T16:00:00Z'),
        requiredEmployees: 1,
        requiredQualifications: [],
        assignments: [{ id: 'a1', userId: 'user1', user: user1 }],
      },
      {
        id: 'shift6',
        title: 'Schicht B',
        siteId: 'site2',
        startTime: new Date('2025-01-14T12:00:00Z'), // Überlappung
        endTime: new Date('2025-01-14T20:00:00Z'),
        requiredEmployees: 1,
        requiredQualifications: [],
        assignments: [{ id: 'a2', userId: 'user1', user: user1 }],
      },
    ]);

    (prisma.objectClearance.findMany as jest.Mock).mockResolvedValue([
      { userId: 'user1', siteId: 'site1', status: 'ACTIVE' },
      { userId: 'user1', siteId: 'site2', status: 'ACTIVE' },
    ]);

    const result = await analyzeShiftConflicts({
      startDate: mockStartDate,
      endDate: mockEndDate,
    });

    // Sollte DOUBLE_BOOKING finden
    const doubleBooking = result.find((c) => c.type === 'DOUBLE_BOOKING');
    expect(doubleBooking).toBeDefined();
    expect(doubleBooking?.severity).toBe('high');
  });

  it('should detect REST_TIME_VIOLATION conflict (MEDIUM)', async () => {
    const user2 = {
      id: 'user2',
      objectClearances: [{ siteId: 'site1', status: 'ACTIVE', validUntil: null }],
    };

    (prisma.shift.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'shift7',
        title: 'Nachtschicht',
        siteId: 'site1',
        startTime: new Date('2025-01-15T22:00:00Z'),
        endTime: new Date('2025-01-16T06:00:00Z'),
        requiredEmployees: 1,
        requiredQualifications: [],
        assignments: [{ id: 'a1', userId: 'user2', user: user2 }],
      },
      {
        id: 'shift8',
        title: 'Frühschicht',
        siteId: 'site1',
        startTime: new Date('2025-01-16T07:00:00Z'), // Nur 1h Pause
        endTime: new Date('2025-01-16T15:00:00Z'),
        requiredEmployees: 1,
        requiredQualifications: [],
        assignments: [{ id: 'a2', userId: 'user2', user: user2 }],
      },
    ]);

    (prisma.objectClearance.findMany as jest.Mock).mockResolvedValue([
      { userId: 'user2', siteId: 'site1', status: 'ACTIVE' },
    ]);

    const result = await analyzeShiftConflicts({
      startDate: mockStartDate,
      endDate: mockEndDate,
    });

    const restViolation = result.find((c) => c.type === 'REST_TIME_VIOLATION');
    expect(restViolation).toBeDefined();
    expect(restViolation?.severity).toBe('medium');
  });

  it('should filter by siteId when provided', async () => {
    (prisma.shift.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'shift9',
        title: 'Site1 Schicht',
        siteId: 'site1',
        startTime: new Date('2025-01-10T08:00:00Z'),
        endTime: new Date('2025-01-10T16:00:00Z'),
        requiredEmployees: 2,
        requiredQualifications: [],
        assignments: [],
      },
    ]);

    await analyzeShiftConflicts({
      startDate: mockStartDate,
      endDate: mockEndDate,
      siteId: 'site1',
    });

    expect(prisma.shift.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          siteId: 'site1',
        }),
      })
    );
  });

  it('should handle empty shifts gracefully', async () => {
    (prisma.shift.findMany as jest.Mock).mockResolvedValue([]);

    const result = await analyzeShiftConflicts({
      startDate: mockStartDate,
      endDate: mockEndDate,
    });

    expect(result).toEqual([]);
  });

  it('should detect OVERSTAFFED conflict (LOW)', async () => {
    (prisma.shift.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'shift10',
        title: 'Überbesetzte Schicht',
        siteId: 'site1',
        startTime: new Date('2025-01-11T10:00:00Z'),
        endTime: new Date('2025-01-11T18:00:00Z'),
        requiredEmployees: 2,
        requiredQualifications: [],
        assignments: [
          {
            id: 'a1',
            userId: 'user1',
            user: { id: 'user1', objectClearances: [{ siteId: 'site1', status: 'ACTIVE' }] },
          },
          {
            id: 'a2',
            userId: 'user2',
            user: { id: 'user2', objectClearances: [{ siteId: 'site1', status: 'ACTIVE' }] },
          },
          {
            id: 'a3',
            userId: 'user3',
            user: { id: 'user3', objectClearances: [{ siteId: 'site1', status: 'ACTIVE' }] },
          },
        ],
      },
    ]);

    (prisma.objectClearance.findMany as jest.Mock).mockResolvedValue([
      { userId: 'user1', siteId: 'site1', status: 'ACTIVE' },
      { userId: 'user2', siteId: 'site1', status: 'ACTIVE' },
      { userId: 'user3', siteId: 'site1', status: 'ACTIVE' },
    ]);

    const result = await analyzeShiftConflicts({
      startDate: mockStartDate,
      endDate: mockEndDate,
    });

    const overstaffed = result.find((c) => c.type === 'OVERSTAFFED');
    expect(overstaffed).toBeDefined();
    expect(overstaffed?.severity).toBe('low');
    expect(overstaffed?.details).toContain('3/2');
  });
});
