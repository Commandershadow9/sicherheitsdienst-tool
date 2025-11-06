import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import { AbsenceStatus } from '@prisma/client';
import prisma from '../utils/prisma';
import { submitAuditEvent } from '../utils/audit';
import { publishNotificationEvent } from '../utils/notificationEvents';
import { checkCapacityWarnings, type CapacityWarning } from '../services/absenceCapacityService';
import { canManage, selectAbsence } from './absenceShared';

/**
 * Preview capacity warnings WITHOUT approving
 * GET /api/absences/:id/capacity-warnings
 */
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

/**
 * Update absence status (approve, reject, cancel)
 * Shared logic for all status changes
 */
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

/**
 * POST /api/absences/:id/approve
 * Approve absence request
 */
export const approveAbsence = (req: Request, res: Response, next: NextFunction): Promise<void> =>
  updateAbsenceStatus(req, res, next, AbsenceStatus.APPROVED);

/**
 * POST /api/absences/:id/reject
 * Reject absence request
 */
export const rejectAbsence = (req: Request, res: Response, next: NextFunction): Promise<void> =>
  updateAbsenceStatus(req, res, next, AbsenceStatus.REJECTED);

/**
 * POST /api/absences/:id/cancel
 * Cancel absence (by employee or manager)
 */
export const cancelAbsence = (req: Request, res: Response, next: NextFunction): Promise<void> =>
  updateAbsenceStatus(req, res, next, AbsenceStatus.CANCELLED);
