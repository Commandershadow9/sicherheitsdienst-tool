import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import { AbsenceStatus, AbsenceType, Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { submitAuditEvent } from '../utils/audit';
import { publishNotificationEvent } from '../utils/notificationEvents';
import { findReplacementCandidatesForShiftV2 } from '../services/replacementService';
import {
  findConflictingShifts,
  checkCapacityWarnings,
  getAffectedShiftsWithCapacity,
  type CapacityWarning,
  type AffectedShift,
  calculateLeaveDaysSaldo,
  type LeaveDaysSaldo,
} from '../services/absenceCapacityService';

export { calculateLeaveDaysSaldo } from '../services/absenceCapacityService';
export type { LeaveDaysSaldo } from '../services/absenceCapacityService';
import {
  PAGE_MAX,
  ensureDate,
  canManage,
  ensureAccess,
  fetchAbsenceOr404,
  selectAbsence,
} from './absenceShared';

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

// Preview: Kapazitätswarnungen OHNE zu genehmigen
export const previewCapacityWarnings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const actor = req.user!;
    const { id } = req.params;

    if (!canManage(actor.role)) {
      throw createError(403, 'Keine Berechtigung für diese Aktion.');
    }

    const absence = await prisma.absence.findUnique({
      where: { id },
      select: { id: true, userId: true, startsAt: true, endsAt: true, type: true, status: true },
    });

    if (!absence) {
      throw createError(404, 'Abwesenheit nicht gefunden.');
    }

    if (absence.status !== AbsenceStatus.REQUESTED) {
      throw createError(400, 'Nur offene Anträge können geprüft werden.');
    }

    // Nur für VACATION prüfen (SICKNESS wird auto-approved, dagegen kann man nichts tun)
    if (absence.type === 'SICKNESS') {
      res.json({ warnings: [] });
      return;
    }

    const warnings = await checkCapacityWarnings(absence.userId, absence.startsAt, absence.endsAt);

    res.json({ warnings });
  } catch (error) {
    next(error);
  }
};

async function updateAbsenceStatus(
  req: Request,
  res: Response,
  next: NextFunction,
  status: AbsenceStatus,
): Promise<void> {
  try {
    const actor = req.user!;
    const { id } = req.params;
    const { decisionNote } = (req.body || {}) as { decisionNote?: string };
    const absence = await prisma.absence.findUnique({
      where: { id },
      select: { id: true, status: true, userId: true },
    });
    if (!absence) {
      throw createError(404, 'Abwesenheit nicht gefunden.');
    }

    if (status === AbsenceStatus.CANCELLED) {
      if (absence.userId !== actor.id && !canManage(actor.role)) {
        throw createError(403, 'Nur Antragsteller oder Manager dürfen stornieren.');
      }
    } else {
      if (!canManage(actor.role)) {
        throw createError(403, 'Keine Berechtigung für diese Aktion.');
      }
    }

    if (status === AbsenceStatus.APPROVED || status === AbsenceStatus.REJECTED) {
      if (absence.status !== AbsenceStatus.REQUESTED) {
        throw createError(400, 'Nur offene Anträge können entschieden werden.');
      }
    }

    if (status === AbsenceStatus.CANCELLED && absence.status === AbsenceStatus.APPROVED && !canManage(actor.role)) {
      throw createError(403, 'Genehmigte Abwesenheiten dürfen nur von Manager/Admin storniert werden.');
    }

    const isManager = canManage(actor.role);
    const decidedByIdUpdate =
      isManager || (status === AbsenceStatus.CANCELLED && !isManager) ? actor.id : undefined;

    const updated = await prisma.absence.update({
      where: { id },
      data: {
        status,
        decisionNote: decisionNote?.trim() || null,
        ...(decidedByIdUpdate !== undefined ? { decidedById: decidedByIdUpdate } : {}),
      },
      select: { ...selectAbsence, startsAt: true, endsAt: true },
    });

    // Kapazitätswarnungen prüfen bei Genehmigung
    let capacityWarnings: CapacityWarning[] = [];
    if (status === AbsenceStatus.APPROVED) {
      capacityWarnings = await checkCapacityWarnings(absence.userId, updated.startsAt, updated.endsAt);
    }

    await submitAuditEvent(req, {
      action:
        status === AbsenceStatus.APPROVED
          ? 'ABSENCE.REQUEST.APPROVE'
          : status === AbsenceStatus.REJECTED
            ? 'ABSENCE.REQUEST.REJECT'
            : 'ABSENCE.REQUEST.CANCEL',
      resourceType: 'ABSENCE',
      resourceId: id,
      outcome: 'SUCCESS',
      data: {
        status,
        decisionNote: decisionNote?.trim() || null,
      },
    });

    // Send notifications
    const user = await prisma.user.findUnique({
      where: { id: absence.userId },
      select: { email: true, firstName: true, lastName: true, emailOptIn: true, pushOptIn: true },
    });

    if (user) {
      const userName = `${user.firstName} ${user.lastName}`;
      const formatDate = (date: Date) => new Date(date).toLocaleDateString('de-DE');

      // Fetch full absence data for notification
      const fullAbsence = await prisma.absence.findUnique({
        where: { id },
        select: { startsAt: true, endsAt: true, type: true },
      });

      if (fullAbsence) {
        const notifData = {
          userName,
          type: fullAbsence.type,
          startsAt: formatDate(fullAbsence.startsAt),
          endsAt: formatDate(fullAbsence.endsAt),
          decisionNote: decisionNote?.trim() || 'Keine Anmerkung',
        };

        // Email notification
        if (user.emailOptIn && process.env.EMAIL_NOTIFY_ABSENCES !== 'false') {
          const templateKey = status === AbsenceStatus.APPROVED
            ? 'absence-approved'
            : status === AbsenceStatus.REJECTED
              ? 'absence-rejected'
              : 'absence-cancelled';

          publishNotificationEvent({
            channel: 'email',
            status: 'sent',
            template: templateKey,
            recipient: user.email,
            title: status === AbsenceStatus.APPROVED
              ? 'Abwesenheit genehmigt'
              : status === AbsenceStatus.REJECTED
                ? 'Abwesenheit abgelehnt'
                : 'Abwesenheit storniert',
            body: JSON.stringify(notifData),
            metadata: { absenceId: id, userId: absence.userId },
          });
        }

        // Push notification
        if (user.pushOptIn && process.env.PUSH_NOTIFY_ABSENCES !== 'false') {
          const templateKey = status === AbsenceStatus.APPROVED
            ? 'absence-approved'
            : status === AbsenceStatus.REJECTED
              ? 'absence-rejected'
              : 'absence-cancelled';

          publishNotificationEvent({
            channel: 'push',
            status: 'sent',
            template: templateKey,
            userIds: [absence.userId],
            title: status === AbsenceStatus.APPROVED
              ? 'Abwesenheit genehmigt'
              : status === AbsenceStatus.REJECTED
                ? 'Abwesenheit abgelehnt'
                : 'Abwesenheit storniert',
            body: `${fullAbsence.type}: ${notifData.startsAt} - ${notifData.endsAt}`,
            metadata: { absenceId: id },
          });
        }
      }
    }

    res.json({ success: true, data: updated, capacityWarnings });
  } catch (error) {
    next(error);
  }
}

export const approveAbsence = (req: Request, res: Response, next: NextFunction): Promise<void> =>
  updateAbsenceStatus(req, res, next, AbsenceStatus.APPROVED);

export const rejectAbsence = (req: Request, res: Response, next: NextFunction): Promise<void> =>
  updateAbsenceStatus(req, res, next, AbsenceStatus.REJECTED);

export const cancelAbsence = (req: Request, res: Response, next: NextFunction): Promise<void> =>
  updateAbsenceStatus(req, res, next, AbsenceStatus.CANCELLED);

// Upload document for absence
// Ersatz-Mitarbeiter für betroffene Schichten finden
export const getReplacementCandidates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const actor = req.user!;
    const { id } = req.params;
    const { shiftId } = req.query as { shiftId?: string };

    if (!canManage(actor.role)) {
      throw createError(403, 'Keine Berechtigung für diese Aktion.');
    }

    const absence = await prisma.absence.findUnique({
      where: { id },
      select: { id: true, userId: true, startsAt: true, endsAt: true },
    });

    if (!absence) {
      throw createError(404, 'Abwesenheit nicht gefunden.');
    }

    // Wenn shiftId angegeben: Nur für diese Schicht
    if (shiftId) {
      const candidates = await findReplacementCandidatesForShiftV2(shiftId, absence.userId);
      res.json({ data: candidates });
      return;
    }

    // Sonst: Für alle betroffenen Schichten
    const affectedShifts = await getAffectedShiftsWithCapacity(
      absence.userId,
      new Date(absence.startsAt),
      new Date(absence.endsAt),
    );

    const results = await Promise.all(
      affectedShifts.map(async (shift) => ({
        shiftId: shift.id,
        shiftTitle: shift.title,
        candidates: await findReplacementCandidatesForShiftV2(shift.id, absence.userId),
      })),
    );

    res.json({ data: results });
  } catch (error) {
    next(error);
  }
};
