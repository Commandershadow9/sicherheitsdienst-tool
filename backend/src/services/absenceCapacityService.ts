import prisma from '../utils/prisma';

export type CapacityWarning = {
  shiftId: string;
  shiftTitle: string;
  siteId: string;
  siteName: string;
  date: string;
  required: number;
  available: number;
  shortage: number;
};

export type AffectedShift = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  site: {
    id: string;
    name: string;
  } | null;
  requiredEmployees: number;
  availableEmployees: number;
  hasCapacityWarning: boolean;
  needsReplacement?: boolean;
};

export async function findConflictingShifts(userId: string, startsAt: Date, endsAt: Date) {
  const assignments = await prisma.shiftAssignment.findMany({
    where: {
      userId,
      shift: {
        startTime: { lt: endsAt },
        endTime: { gt: startsAt },
      },
      status: { in: ['ASSIGNED', 'CONFIRMED', 'STARTED'] },
    },
    select: {
      shift: {
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          status: true,
        },
      },
    },
  });
  return assignments.map((assignment) => assignment.shift);
}

export async function checkCapacityWarnings(
  userId: string,
  startsAt: Date,
  endsAt: Date,
): Promise<CapacityWarning[]> {
  const warnings: CapacityWarning[] = [];

  const userShifts = await prisma.shiftAssignment.findMany({
    where: {
      userId,
      shift: {
        startTime: { lt: endsAt },
        endTime: { gt: startsAt },
      },
      status: { in: ['ASSIGNED', 'CONFIRMED', 'STARTED'] },
    },
    select: {
      shift: {
        select: {
          id: true,
          title: true,
          siteId: true,
          site: {
            select: {
              id: true,
              name: true,
            },
          },
          startTime: true,
          endTime: true,
          requiredEmployees: true,
          assignments: {
            where: {
              status: { in: ['ASSIGNED', 'CONFIRMED', 'STARTED'] },
            },
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  for (const assignment of userShifts) {
    const shift = assignment.shift;
    if (!shift.siteId) continue;

    const otherAbsences = await prisma.absence.findMany({
      where: {
        status: 'APPROVED',
        startsAt: { lt: shift.endTime },
        endsAt: { gt: shift.startTime },
      },
      select: { userId: true },
    });

    const absentUserIds = new Set(otherAbsences.map((absence) => absence.userId));
    absentUserIds.add(userId);

    const clearedUsers = await prisma.objectClearance.findMany({
      where: {
        siteId: shift.siteId,
        status: 'ACTIVE',
        OR: [
          { validUntil: null },
          { validUntil: { gte: shift.startTime } },
        ],
      },
      select: { userId: true },
    });

    const availableCount = clearedUsers.filter((clearance) => !absentUserIds.has(clearance.userId)).length;
    const required = shift.requiredEmployees;

    if (availableCount < required) {
      warnings.push({
        shiftId: shift.id,
        shiftTitle: shift.title,
        siteId: shift.siteId,
        siteName: shift.site?.name || 'Unbekannt',
        date: shift.startTime.toISOString().split('T')[0],
        required,
        available: availableCount,
        shortage: required - availableCount,
      });
    }
  }

  return warnings;
}

export async function getAffectedShiftsWithCapacity(
  userId: string,
  startsAt: Date,
  endsAt: Date,
): Promise<AffectedShift[]> {
  const affectedShifts: AffectedShift[] = [];

  const userShifts = await prisma.shiftAssignment.findMany({
    where: {
      userId,
      shift: {
        startTime: { lt: endsAt },
        endTime: { gt: startsAt },
      },
      status: { in: ['ASSIGNED', 'CONFIRMED', 'STARTED'] },
    },
    select: {
      shift: {
        select: {
          id: true,
          title: true,
          siteId: true,
          site: {
            select: {
              id: true,
              name: true,
            },
          },
          startTime: true,
          endTime: true,
          requiredEmployees: true,
        },
      },
    },
  });

  for (const assignment of userShifts) {
    const shift = assignment.shift;

    let availableEmployees: number;

    if (shift.siteId) {
      const otherAbsences = await prisma.absence.findMany({
        where: {
          status: 'APPROVED',
          startsAt: { lt: shift.endTime },
          endsAt: { gt: shift.startTime },
        },
        select: { userId: true },
      });

      const absentUserIds = new Set(otherAbsences.map((absence) => absence.userId));
      absentUserIds.add(userId);

      availableEmployees = await prisma.shiftAssignment.count({
        where: {
          shiftId: shift.id,
          status: { in: ['ASSIGNED', 'CONFIRMED', 'STARTED'] },
          userId: { notIn: Array.from(absentUserIds) },
        },
      });
    } else {
      availableEmployees = await prisma.shiftAssignment.count({
        where: {
          shiftId: shift.id,
          status: { in: ['ASSIGNED', 'CONFIRMED', 'STARTED'] },
        },
      });
    }

    const required = shift.requiredEmployees;
    const hasWarning = availableEmployees < required;

    affectedShifts.push({
      id: shift.id,
      title: shift.title,
      startTime: shift.startTime.toISOString(),
      endTime: shift.endTime.toISOString(),
      site: shift.site,
      requiredEmployees: required,
      availableEmployees,
      hasCapacityWarning: hasWarning,
      needsReplacement: hasWarning,
    });
  }

  return affectedShifts;
}

export type LeaveDaysSaldo = {
  annualLeaveDays: number;
  takenDays: number;
  requestedDays: number;
  remainingDays: number;
  remainingAfterApproval: number;
};

export async function calculateLeaveDaysSaldo(
  userId: string,
  currentAbsenceId?: string,
): Promise<LeaveDaysSaldo | null> {
  const profile = await prisma.employeeProfile.findUnique({
    where: { userId },
    select: { annualLeaveDays: true },
  });

  if (!profile) {
    return null;
  }

  const annualLeaveDays = profile.annualLeaveDays;
  const currentYear = new Date().getFullYear();
  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

  const takenAbsences = await prisma.absence.findMany({
    where: {
      userId,
      type: 'VACATION',
      status: 'APPROVED',
      startsAt: { gte: yearStart, lte: yearEnd },
    },
    select: { startsAt: true, endsAt: true },
  });

  const requestedAbsences = await prisma.absence.findMany({
    where: {
      userId,
      type: 'VACATION',
      status: 'REQUESTED',
      startsAt: { gte: yearStart, lte: yearEnd },
    },
    select: { startsAt: true, endsAt: true },
  });

  const calculateDays = (absences: Array<{ startsAt: Date; endsAt: Date }>): number =>
    absences.reduce((sum, absence) => {
      const start = new Date(absence.startsAt);
      const end = new Date(absence.endsAt);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return sum + days;
    }, 0);

  const takenDays = calculateDays(takenAbsences);
  const requestedDays = calculateDays(requestedAbsences);

  let currentAbsenceDays = 0;
  if (currentAbsenceId) {
    const currentAbsence = await prisma.absence.findUnique({
      where: { id: currentAbsenceId },
      select: { startsAt: true, endsAt: true, type: true, status: true },
    });
    if (currentAbsence && currentAbsence.type === 'VACATION') {
      currentAbsenceDays = calculateDays([currentAbsence]);
    }
  }

  const remainingDays = annualLeaveDays - takenDays;
  const remainingAfterApproval = annualLeaveDays - takenDays - currentAbsenceDays;

  return {
    annualLeaveDays,
    takenDays,
    requestedDays,
    remainingDays,
    remainingAfterApproval,
  };
}
