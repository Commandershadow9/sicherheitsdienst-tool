import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import { AbsenceStatus, AbsenceType, Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { submitAuditEvent } from '../utils/audit';
import { publishNotificationEvent } from '../utils/notificationEvents';
import {
  findConflictingShifts,
  getAffectedShiftsWithCapacity,
  calculateLeaveDaysSaldo,
  type LeaveDaysSaldo,
} from '../services/absenceCapacityService';
import {
  PAGE_MAX,
  ensureDate,
  canManage,
  ensureAccess,
  fetchAbsenceOr404,
  selectAbsence,
} from './absenceShared';

// Re-export for compatibility
export { calculateLeaveDaysSaldo } from '../services/absenceCapacityService';
export type { LeaveDaysSaldo } from '../services/absenceCapacityService';

/**
 * GET /api/absences
 * List absences with pagination and filters
 */
export const listAbsences = async (req: Request, res: Response) => {
  const actor = req.user!;
  const q = req.query as Record<string, string | undefined>;
  const page = Math.max(parseInt(q.page ?? '1', 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(q.pageSize ?? '25', 10) || 25, 1), PAGE_MAX);
  const skip = (page - 1) * pageSize;

  const where: Prisma.AbsenceWhereInput = {};

  if (actor.role === 'EMPLOYEE') {
    where.userId = actor.id;
  } else if (q.userId) {
    where.userId = q.userId;
  }

  if (q.status && Object.values(AbsenceStatus).includes(q.status as AbsenceStatus)) {
    where.status = q.status as AbsenceStatus;
  }

  if (q.type && Object.values(AbsenceType).includes(q.type as AbsenceType)) {
    where.type = q.type as AbsenceType;
  }

  const andConditions: Prisma.AbsenceWhereInput[] = [];
  if (q.from) {
    const fromDate = ensureDate(q.from, 'from');
    andConditions.push({ endsAt: { gte: fromDate } });
  }
  if (q.to) {
    const toDate = ensureDate(q.to, 'to');
    andConditions.push({ startsAt: { lte: toDate } });
  }
  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  const [total, data] = await prisma.$transaction([
    prisma.absence.count({ where }),
    prisma.absence.findMany({
      where,
      select: selectAbsence,
      orderBy: { startsAt: 'desc' },
      skip,
      take: pageSize,
    }),
  ]);

  res.json({
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    },
  });
};

/**
 * POST /api/absences
 * Create new absence request
 */
export const createAbsence = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const { type, startsAt, endsAt, reason, userId } = req.body as {
      type: AbsenceType;
      startsAt: string;
      endsAt: string;
      reason?: string;
      userId?: string;
    };

    const targetUserId = userId ?? actor.id;
    if (!canManage(actor.role) && targetUserId !== actor.id) {
      throw createError(403, 'Keine Berechtigung, Abwesenheiten für andere Mitarbeiter zu erstellen.');
    }

    const startDate = ensureDate(startsAt, 'startsAt');
    const endDate = ensureDate(endsAt, 'endsAt');
    if (endDate < startDate) {
      throw createError(422, 'Enddatum muss nach dem Startdatum liegen.');
    }

    // Nur SICKNESS wird automatisch genehmigt, alle anderen Typen müssen approved werden
    const shouldAutoApprove = type === AbsenceType.SICKNESS;

    const absence = await prisma.absence.create({
      data: {
        userId: targetUserId,
        createdById: actor.id,
        type,
        status: shouldAutoApprove ? AbsenceStatus.APPROVED : AbsenceStatus.REQUESTED,
        decidedById: shouldAutoApprove ? actor.id : null,
        decisionNote:
          shouldAutoApprove
            ? 'Automatisch genehmigt (Krankmeldung)'
            : null,
        startsAt: startDate,
        endsAt: endDate,
        reason: reason?.trim() || null,
      },
      select: selectAbsence,
    });

    const conflicts = await findConflictingShifts(targetUserId, startDate, endDate);

    await submitAuditEvent(req, {
      action: 'ABSENCE.REQUEST.CREATE',
      resourceType: 'ABSENCE',
      resourceId: absence.id,
      outcome: 'SUCCESS',
      data: {
        type,
        startsAt: startDate,
        endsAt: endDate,
        userId: targetUserId,
        conflicts: conflicts.map((c) => c?.id),
      },
    });

    // Benachrichtigung an Manager bei Krankmeldung
    if (type === AbsenceType.SICKNESS) {
      // Lade Manager/Admin
      const managers = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'MANAGER'] },
          emailOptIn: true,
        },
        select: { email: true, firstName: true, lastName: true, pushOptIn: true },
      });

      const employee = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { firstName: true, lastName: true },
      });

      if (employee) {
        const employeeName = `${employee.firstName} ${employee.lastName}`;
        const formatDate = (date: Date) => new Date(date).toLocaleDateString('de-DE');

        const notifData = {
          employeeName,
          type: 'SICKNESS',
          startsAt: formatDate(startDate),
          endsAt: formatDate(endDate),
        };

        // Email an alle Manager
        for (const manager of managers) {
          if (process.env.EMAIL_NOTIFY_ABSENCES !== 'false') {
            publishNotificationEvent({
              channel: 'email',
              status: 'sent',
              template: 'absence-sickness-manager',
              recipient: manager.email,
              title: `Krankmeldung: ${employeeName}`,
              body: JSON.stringify(notifData),
              metadata: { absenceId: absence.id, userId: targetUserId },
            });
          }

          // Push an alle Manager mit Opt-In
          if (manager.pushOptIn && process.env.PUSH_NOTIFY_ABSENCES !== 'false') {
            publishNotificationEvent({
              channel: 'push',
              status: 'sent',
              template: 'absence-sickness-manager',
              recipient: manager.email,
              title: `Krankmeldung: ${employeeName}`,
              body: `${employeeName} hat sich krankgemeldet: ${notifData.startsAt} - ${notifData.endsAt}`,
              metadata: { absenceId: absence.id },
            });
          }
        }
      }
    }

    res.status(201).json({ success: true, data: absence, conflicts });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/absences/:id
 * Get absence by ID with detailed information
 */
export const getAbsenceById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const { id } = req.params;
    const absence = await fetchAbsenceOr404(id);
    ensureAccess(absence, actor);

    // Lade ObjectClearances des betroffenen Mitarbeiters
    const objectClearances = await prisma.objectClearance.findMany({
      where: { userId: absence.userId },
      select: {
        id: true,
        status: true,
        trainedAt: true,
        validUntil: true,
        site: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: { trainedAt: 'desc' },
    });

    // Lade betroffene Schichten mit Kapazitäts-Infos
    const affectedShifts = await getAffectedShiftsWithCapacity(
      absence.userId,
      new Date(absence.startsAt),
      new Date(absence.endsAt),
    );

    // Berechne Urlaubstage-Saldo (nur für VACATION)
    let leaveDaysSaldo: LeaveDaysSaldo | null = null;
    if (absence.type === 'VACATION') {
      leaveDaysSaldo = await calculateLeaveDaysSaldo(absence.userId, absence.id);
    }

    const { userId: _omit, ...rest } = absence;
    res.json({
      data: {
        ...rest,
        objectClearances,
        affectedShifts,
        leaveDaysSaldo,
      },
    });
  } catch (error) {
    next(error);
  }
};
