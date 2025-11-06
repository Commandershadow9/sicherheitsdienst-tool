import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AbsenceStatus, ShiftStatus, AssignmentStatus } from '@prisma/client';
import createError from 'http-errors';

/**
 * Dashboard Employee Controller
 * Handles employee availability and statistics
 */

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

/**
 * GET /api/dashboard/employees/available
 * Liste aller heute verfügbaren Mitarbeiter
 */
export const getAvailableEmployees = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;

    if (actor.role !== 'ADMIN' && actor.role !== 'MANAGER') {
      throw createError(403, 'Keine Berechtigung für Dashboard-Zugriff.');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Heute abwesende Mitarbeiter-IDs
    const absentUserIds = await prisma.absence.findMany({
      where: {
        status: AbsenceStatus.APPROVED,
        startsAt: { lte: tomorrow },
        endsAt: { gte: today },
      },
      select: {
        userId: true,
      },
    });

    const absentIds = absentUserIds.map((a) => a.userId);

    // Alle aktiven Mitarbeiter OHNE Abwesenheit
    const availableEmployees = await prisma.user.findMany({
      where: {
        role: 'EMPLOYEE',
        isActive: true,
        id: { notIn: absentIds },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
      orderBy: {
        lastName: 'asc',
      },
    });

    res.json({ data: availableEmployees });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/employees/on-vacation
 * Liste aller Mitarbeiter im Urlaub
 */
export const getEmployeesOnVacation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;

    if (actor.role !== 'ADMIN' && actor.role !== 'MANAGER') {
      throw createError(403, 'Keine Berechtigung für Dashboard-Zugriff.');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Urlaub-Abwesenheiten heute
    const vacations = await prisma.absence.findMany({
      where: {
        status: AbsenceStatus.APPROVED,
        type: 'VACATION',
        startsAt: { lte: tomorrow },
        endsAt: { gte: today },
      },
      select: {
        startsAt: true,
        endsAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    const employees = vacations.map((v) => ({
      ...v.user,
      absenceStart: v.startsAt,
      absenceEnd: v.endsAt,
    }));

    res.json({ data: employees });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/employees/on-sick-leave
 * Liste aller kranken Mitarbeiter
 */
export const getEmployeesOnSickLeave = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;

    if (actor.role !== 'ADMIN' && actor.role !== 'MANAGER') {
      throw createError(403, 'Keine Berechtigung für Dashboard-Zugriff.');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Krankmeldungen heute
    const sickLeaves = await prisma.absence.findMany({
      where: {
        status: AbsenceStatus.APPROVED,
        type: 'SICKNESS',
        startsAt: { lte: tomorrow },
        endsAt: { gte: today },
      },
      select: {
        startsAt: true,
        endsAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    const employees = sickLeaves.map((s) => ({
      ...s.user,
      absenceStart: s.startsAt,
      absenceEnd: s.endsAt,
    }));

    res.json({ data: employees });
  } catch (error) {
    next(error);
  }
};
