import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AbsenceStatus, ShiftStatus, AssignmentStatus } from '@prisma/client';
import createError from 'http-errors';
import { calculateLeaveDaysSaldo, type LeaveDaysSaldo } from './absenceController';

/**
 * Dashboard Approval Controller
 * Handles pending absence approval workflow and analysis
 */

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

/**
 * Helper: Build shift details for absence period
 * Returns shifts that would be affected by the absence with capacity warnings
 */
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

        // Urlaubstage-Saldo (nur bei VACATION)
        let leaveDaysSaldo: LeaveDaysSaldo | null = null;
        let leaveDaysExceeded = false;

        if (absence.type === 'VACATION') {
          leaveDaysSaldo = await calculateLeaveDaysSaldo(absence.user.id, absence.id);
          if (leaveDaysSaldo) {
            leaveDaysExceeded = leaveDaysSaldo.remainingAfterApproval < 0;
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
          leaveDaysSaldo,
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
