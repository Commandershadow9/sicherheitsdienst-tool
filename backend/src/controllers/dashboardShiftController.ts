import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AbsenceStatus, ShiftStatus, AssignmentStatus } from '@prisma/client';
import createError from 'http-errors';

/**
 * Dashboard Shift Controller
 * Handles shift capacity metrics and warnings
 */

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
        const assignedCount = shift.assignments.length;
        const absentAssignments = shift.assignments.filter((assignment) => absentUserIds.has(assignment.userId));
        const absentCount = absentAssignments.length;
        const availableCount = assignedCount - absentCount;
        const shortage = shift.requiredEmployees - availableCount;

        if (shortage <= 0) return null; // Nicht kritisch

        // Finde Gründe (welche zugewiesenen Mitarbeiter sind abwesend)
        const reasons = absentAssignments
          .map((a) => {
            const absence = activeAbsences.find((abs) => abs.userId === a.userId)!;
            return {
              employeeName: `${a.user.firstName} ${a.user.lastName}`,
              reason: absence.type === 'SICKNESS' ? 'Krankmeldung' : 'Urlaub',
            };
          });

        const coverageBufferBeforeAbsences = Math.max(assignedCount - shift.requiredEmployees, 0);
        const coveredAbsences = Math.max(absentCount - shortage, 0);

        return {
          shiftId: shift.id,
          shiftTitle: shift.title,
          siteName: shift.site?.name || 'Unbekannt',
          startTime: shift.startTime,
          endTime: shift.endTime,
          requiredEmployees: shift.requiredEmployees,
          availableEmployees: availableCount,
          shortage,
          assignedEmployees: assignedCount,
          absentEmployees: absentCount,
          coveredAbsences,
          coverageBufferBeforeAbsences,
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
