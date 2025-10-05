import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AbsenceStatus, ShiftStatus, AssignmentStatus } from '@prisma/client';
import createError from 'http-errors';

type PendingShiftDetail = {
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
  needsReplacement: boolean;
};

async function buildShiftDetailsForAbsence(
  userId: string,
  startsAt: Date,
  endsAt: Date,
): Promise<PendingShiftDetail[]> {
  const assignments = await prisma.shiftAssignment.findMany({
    where: {
      userId,
      status: { in: [AssignmentStatus.ASSIGNED, AssignmentStatus.CONFIRMED, AssignmentStatus.STARTED] },
      shift: {
        startTime: { lt: endsAt },
        endTime: { gt: startsAt },
        status: { in: [ShiftStatus.PLANNED, ShiftStatus.ACTIVE] },
      },
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
              status: { in: [AssignmentStatus.ASSIGNED, AssignmentStatus.CONFIRMED, AssignmentStatus.STARTED] },
            },
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  const details: PendingShiftDetail[] = [];

  for (const assignment of assignments) {
    const shift = assignment.shift;

    let availableCount = 0;
    if (shift.siteId) {
      const otherAbsences = await prisma.absence.findMany({
        where: {
          status: AbsenceStatus.APPROVED,
          startsAt: { lt: shift.endTime },
          endsAt: { gt: shift.startTime },
        },
        select: { userId: true },
      });

      const absentUserIds = new Set(otherAbsences.map((absence) => absence.userId));
      absentUserIds.add(userId);

      availableCount = await prisma.shiftAssignment.count({
        where: {
          shiftId: shift.id,
          status: { in: [AssignmentStatus.ASSIGNED, AssignmentStatus.CONFIRMED, AssignmentStatus.STARTED] },
          userId: {
            notIn: Array.from(absentUserIds),
          },
        },
      });
    } else {
      availableCount = await prisma.shiftAssignment.count({
        where: {
          shiftId: shift.id,
          status: { in: [AssignmentStatus.ASSIGNED, AssignmentStatus.CONFIRMED, AssignmentStatus.STARTED] },
        },
      });
    }

    const hasCapacityWarning = availableCount < shift.requiredEmployees;

    details.push({
      id: shift.id,
      title: shift.title,
      startTime: shift.startTime.toISOString(),
      endTime: shift.endTime.toISOString(),
      site: shift.site,
      requiredEmployees: shift.requiredEmployees,
      availableEmployees: availableCount,
      hasCapacityWarning,
      needsReplacement: hasCapacityWarning,
    });
  }

  return details;
}

/**
 * GET /api/dashboard/critical
 * Heute kritische Schichten (unterbesetzt durch Abwesenheiten)
 */
export const getCriticalShifts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;

    // Nur ADMIN und MANAGER dürfen Dashboard sehen
    if (actor.role !== 'ADMIN' && actor.role !== 'MANAGER') {
      throw createError(403, 'Keine Berechtigung für Dashboard-Zugriff.');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Finde alle Schichten von HEUTE
    const todayShifts = await prisma.shift.findMany({
      where: {
        startTime: {
          gte: today,
          lt: tomorrow,
        },
        status: { in: [ShiftStatus.PLANNED, ShiftStatus.ACTIVE] },
      },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        requiredEmployees: true,
        site: {
          select: {
            id: true,
            name: true,
          },
        },
        assignments: {
          where: {
            status: { in: [AssignmentStatus.ASSIGNED, AssignmentStatus.CONFIRMED, AssignmentStatus.STARTED] },
          },
          select: {
            userId: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Finde alle APPROVED Abwesenheiten die heute aktiv sind
    const activeAbsences = await prisma.absence.findMany({
      where: {
        status: AbsenceStatus.APPROVED,
        startsAt: { lte: tomorrow },
        endsAt: { gte: today },
      },
      select: {
        id: true,
        userId: true,
        type: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const absentUserIds = new Set(activeAbsences.map((a) => a.userId));

    // Berechne kritische Schichten
    const criticalShifts = todayShifts
      .map((shift) => {
        // Verfügbare Mitarbeiter = Zugewiesen MINUS Abwesende
        const assignedUsers = shift.assignments.map((a) => a.userId);
        const availableUsers = assignedUsers.filter((userId) => !absentUserIds.has(userId));
        const availableCount = availableUsers.length;
        const shortage = shift.requiredEmployees - availableCount;

        if (shortage <= 0) return null; // Nicht kritisch

        // Finde Gründe (welche zugewiesenen Mitarbeiter sind abwesend)
        const reasons = shift.assignments
          .filter((a) => absentUserIds.has(a.userId))
          .map((a) => {
            const absence = activeAbsences.find((abs) => abs.userId === a.userId)!;
            return {
              employeeName: `${a.user.firstName} ${a.user.lastName}`,
              reason: absence.type === 'SICKNESS' ? 'Krankmeldung' : 'Urlaub',
            };
          });

        return {
          shiftId: shift.id,
          shiftTitle: shift.title,
          siteName: shift.site?.name || 'Unbekannt',
          startTime: shift.startTime,
          endTime: shift.endTime,
          requiredEmployees: shift.requiredEmployees,
          availableEmployees: availableCount,
          shortage,
          reasons,
        };
      })
      .filter((s) => s !== null);

    res.json({ data: criticalShifts });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/pending-approvals
 * Ausstehende Abwesenheits-Genehmigungen mit Kontext
 */
export const getPendingApprovals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;

    if (actor.role !== 'ADMIN' && actor.role !== 'MANAGER') {
      throw createError(403, 'Keine Berechtigung für Dashboard-Zugriff.');
    }

    const pendingAbsences = await prisma.absence.findMany({
      where: {
        status: AbsenceStatus.REQUESTED,
      },
      select: {
        id: true,
        type: true,
        startsAt: true,
        endsAt: true,
        reason: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // Älteste zuerst
      },
      take: 50, // Max 50 ausstehende
    });

    // Für jede Abwesenheit: Berechne Warnungen (betroffene Schichten, Kapazität)
    const enrichedAbsences = await Promise.all(
      pendingAbsences.map(async (absence) => {
        const shiftDetails = await buildShiftDetailsForAbsence(
          absence.user.id,
          absence.startsAt,
          absence.endsAt,
        );

        const affectedShifts = shiftDetails.length;
        const criticalShifts = shiftDetails.filter((shift) => shift.hasCapacityWarning).length;

        // Urlaubstage-Check (nur bei VACATION)
        let leaveDaysExceeded = false;
        if (absence.type === 'VACATION') {
          const profile = await prisma.employeeProfile.findUnique({
            where: { userId: absence.user.id },
            select: { annualLeaveDays: true },
          });

          if (profile) {
            // Berechne bereits genommene Tage
            const approvedAbsences = await prisma.absence.findMany({
              where: {
                userId: absence.user.id,
                status: AbsenceStatus.APPROVED,
                type: 'VACATION',
              },
              select: { startsAt: true, endsAt: true },
            });

            const takenDays = approvedAbsences.reduce((sum, abs) => {
              const days = Math.ceil(
                (new Date(abs.endsAt).getTime() - new Date(abs.startsAt).getTime()) / (1000 * 60 * 60 * 24),
              );
              return sum + days;
            }, 0);

            const requestedDays = Math.ceil(
              (new Date(absence.endsAt).getTime() - new Date(absence.startsAt).getTime()) / (1000 * 60 * 60 * 24),
            );

            leaveDaysExceeded = takenDays + requestedDays > profile.annualLeaveDays;
          }
        }

        const requestedDays = Math.ceil(
          (new Date(absence.endsAt).getTime() - new Date(absence.startsAt).getTime()) / (1000 * 60 * 60 * 24),
        );

        return {
          absenceId: absence.id,
          employee: {
            id: absence.user.id,
            firstName: absence.user.firstName,
            lastName: absence.user.lastName,
            email: absence.user.email,
          },
          type: absence.type,
          startsAt: absence.startsAt,
          endsAt: absence.endsAt,
          requestedDays,
          reason: absence.reason || null,
          createdAt: absence.createdAt,
          warnings: {
            affectedShifts,
            criticalShifts,
            leaveDaysExceeded,
            shiftDetails,
          },
        };
      }),
    );

    res.json({ data: enrichedAbsences });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/warnings?days=7
 * Kapazitätswarnungen für nächste N Tage
 */
export const getWarnings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;

    if (actor.role !== 'ADMIN' && actor.role !== 'MANAGER') {
      throw createError(403, 'Keine Berechtigung für Dashboard-Zugriff.');
    }

    const days = parseInt(req.query.days as string) || 7;
    if (days < 1 || days > 30) {
      throw createError(422, 'Parameter days muss zwischen 1 und 30 liegen.');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);

    // Schichten in den nächsten N Tagen
    const upcomingShifts = await prisma.shift.findMany({
      where: {
        startTime: {
          gte: today,
          lt: futureDate,
        },
        status: { in: [ShiftStatus.PLANNED, ShiftStatus.ACTIVE] },
      },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        requiredEmployees: true,
        site: {
          select: {
            name: true,
          },
        },
        assignments: {
          where: {
            status: { in: [AssignmentStatus.ASSIGNED, AssignmentStatus.CONFIRMED] },
          },
          select: {
            userId: true,
          },
        },
      },
    });

    // Approved Abwesenheiten im Zeitraum
    const futureAbsences = await prisma.absence.findMany({
      where: {
        status: AbsenceStatus.APPROVED,
        startsAt: { lte: futureDate },
        endsAt: { gte: today },
      },
      select: {
        userId: true,
        startsAt: true,
        endsAt: true,
      },
    });

    // Für jede Schicht: Prüfe ob unterbesetzt
    const warnings = upcomingShifts
      .map((shift) => {
        const shiftStart = new Date(shift.startTime);
        const shiftEnd = new Date(shift.endTime);

        // Welche Mitarbeiter sind während dieser Schicht abwesend?
        const absentUsers = futureAbsences
          .filter((abs) => {
            return new Date(abs.startsAt) < shiftEnd && new Date(abs.endsAt) > shiftStart;
          })
          .map((a) => a.userId);

        const availableCount = shift.assignments.filter((a) => !absentUsers.includes(a.userId)).length;
        const shortage = shift.requiredEmployees - availableCount;

        if (shortage <= 0) return null;

        return {
          date: shift.startTime.toISOString().split('T')[0],
          shiftId: shift.id,
          shiftTitle: shift.title,
          siteName: shift.site?.name || 'Unbekannt',
          startTime: shift.startTime,
          endTime: shift.endTime,
          requiredEmployees: shift.requiredEmployees,
          availableEmployees: availableCount,
          shortage,
        };
      })
      .filter((w) => w !== null);

    res.json({ data: warnings });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/stats
 * Übersichts-Statistiken für heute
 */
export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;

    if (actor.role !== 'ADMIN' && actor.role !== 'MANAGER') {
      throw createError(403, 'Keine Berechtigung für Dashboard-Zugriff.');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Gesamtzahl Mitarbeiter (aktive Employees)
    const totalEmployees = await prisma.user.count({
      where: {
        role: 'EMPLOYEE',
        isActive: true,
      },
    });

    // Heute abwesend
    const absencesToday = await prisma.absence.findMany({
      where: {
        status: AbsenceStatus.APPROVED,
        startsAt: { lte: tomorrow },
        endsAt: { gte: today },
      },
      select: {
        type: true,
      },
    });

    const onVacation = absencesToday.filter((a) => a.type === 'VACATION').length;
    const onSickLeave = absencesToday.filter((a) => a.type === 'SICKNESS').length;
    const availableToday = totalEmployees - absencesToday.length;

    // Ausstehende Genehmigungen
    const pendingApprovals = await prisma.absence.count({
      where: { status: AbsenceStatus.REQUESTED },
    });

    // Kritische Schichten heute (schnelle Zählung)
    const todayShifts = await prisma.shift.findMany({
      where: {
        startTime: { gte: today, lt: tomorrow },
        status: { in: [ShiftStatus.PLANNED, ShiftStatus.ACTIVE] },
      },
      select: {
        requiredEmployees: true,
        assignments: {
          where: { status: { in: [AssignmentStatus.ASSIGNED, AssignmentStatus.CONFIRMED] } },
          select: { userId: true },
        },
      },
    });

    // Vereinfachte Zählung
    const criticalShiftsToday = todayShifts.filter((s) => s.assignments.length < s.requiredEmployees).length;

    // Warnungen nächste 7 Tage (schnelle Schätzung)
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 7);
    const upcomingShifts = await prisma.shift.count({
      where: {
        startTime: { gte: tomorrow, lt: futureDate },
        status: { in: [ShiftStatus.PLANNED, ShiftStatus.ACTIVE] },
      },
    });

    res.json({
      data: {
        totalEmployees,
        availableToday,
        onVacation,
        onSickLeave,
        pendingApprovals,
        criticalShiftsToday,
        upcomingWarnings: Math.min(upcomingShifts, 10), // Placeholder
      },
    });
  } catch (error) {
    next(error);
  }
};
