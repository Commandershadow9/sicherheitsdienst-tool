import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import { AbsenceStatus, AbsenceType, Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { submitAuditEvent } from '../utils/audit';
import { saveDocumentFile, resolveDocumentPath, removeDocumentFile } from '../utils/documentStorage';
import { publishNotificationEvent } from '../utils/notificationEvents';
import fs from 'fs/promises';

const PAGE_MAX = 100;

const selectAbsence = {
  id: true,
  type: true,
  status: true,
  startsAt: true,
  endsAt: true,
  reason: true,
  decisionNote: true,
  decidedById: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
  decidedBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
  documents: {
    select: {
      id: true,
      filename: true,
      mimeType: true,
      size: true,
      createdAt: true,
    },
  },
} satisfies Prisma.AbsenceSelect;

function ensureDate(value: string, label: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw createError(422, `${label} ist ungültig.`);
  }
  return date;
}

function canManage(actorRole: string | undefined): boolean {
  return actorRole === 'ADMIN' || actorRole === 'MANAGER';
}

function ensureAccess(absence: { userId: string }, actor: { id: string; role: string }) {
  if (actor.role === 'ADMIN' || actor.role === 'MANAGER') return;
  if (absence.userId === actor.id) return;
  throw createError(403, 'Keine Berechtigung für diese Abwesenheit.');
}

async function fetchAbsenceOr404(id: string) {
  const absence = await prisma.absence.findUnique({
    where: { id },
    select: { ...selectAbsence, userId: true },
  });
  if (!absence) {
    throw createError(404, 'Abwesenheit nicht gefunden.');
  }
  return absence;
}

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

async function findConflictingShifts(userId: string, startsAt: Date, endsAt: Date) {
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
  return assignments.map((a) => a.shift);
}

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

    const shouldAutoApprove =
      type === AbsenceType.SICKNESS || canManage(actor.role);

    const absence = await prisma.absence.create({
      data: {
        userId: targetUserId,
        createdById: actor.id,
        type,
        status: shouldAutoApprove ? AbsenceStatus.APPROVED : AbsenceStatus.REQUESTED,
        decidedById: shouldAutoApprove ? actor.id : null,
        decisionNote:
          shouldAutoApprove && type === AbsenceType.SICKNESS
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
    const { userId: _omit, ...rest } = absence;
    res.json({ data: rest });
  } catch (error) {
    next(error);
  }
};

async function updateAbsenceStatus(
  req: Request,
  res: Response,
  next: NextFunction,
  status: AbsenceStatus,
) {
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
      select: selectAbsence,
    });

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

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

export const approveAbsence = (req: Request, res: Response, next: NextFunction) =>
  updateAbsenceStatus(req, res, next, AbsenceStatus.APPROVED);

export const rejectAbsence = (req: Request, res: Response, next: NextFunction) =>
  updateAbsenceStatus(req, res, next, AbsenceStatus.REJECTED);

export const cancelAbsence = (req: Request, res: Response, next: NextFunction) =>
  updateAbsenceStatus(req, res, next, AbsenceStatus.CANCELLED);

// Upload document for absence
export const uploadAbsenceDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const { id } = req.params;
    const absence = await fetchAbsenceOr404(id);
    ensureAccess(absence, actor);

    const { filename, content, mimeType } = req.body as {
      filename?: string;
      content?: string;
      mimeType?: string;
    };

    if (!filename || !content) {
      throw createError(422, 'Dateiname und Inhalt sind erforderlich.');
    }

    // Decode base64 content
    const buffer = Buffer.from(content, 'base64');

    // Size limit: 50MB
    if (buffer.length > 50 * 1024 * 1024) {
      throw createError(413, 'Datei zu groß (max. 50MB).');
    }

    // Save file
    const saved = await saveDocumentFile({
      userId: absence.userId,
      originalName: filename,
      buffer,
      mimeType: mimeType || 'application/octet-stream',
      subFolder: 'absences',
    });

    // Create DB record
    const document = await prisma.absenceDocument.create({
      data: {
        absenceId: id,
        filename,
        mimeType: saved.mimeType || 'application/octet-stream',
        size: saved.size,
        storedAt: saved.storedAt,
        uploadedBy: actor.id,
      },
    });

    await submitAuditEvent(req, {
      action: 'ABSENCE.DOCUMENT.UPLOAD',
      resourceType: 'ABSENCE_DOCUMENT',
      resourceId: document.id,
      outcome: 'SUCCESS',
      data: { absenceId: id, filename, size: saved.size },
    });

    res.status(201).json({ success: true, data: document });
  } catch (error) {
    next(error);
  }
};

// Download document
export const downloadAbsenceDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const { id, documentId } = req.params;

    const absence = await fetchAbsenceOr404(id);
    ensureAccess(absence, actor);

    const document = await prisma.absenceDocument.findFirst({
      where: { id: documentId, absenceId: id },
    });

    if (!document) {
      throw createError(404, 'Dokument nicht gefunden.');
    }

    const absolutePath = resolveDocumentPath(document.storedAt);
    const fileBuffer = await fs.readFile(absolutePath);

    await submitAuditEvent(req, {
      action: 'ABSENCE.DOCUMENT.DOWNLOAD',
      resourceType: 'ABSENCE_DOCUMENT',
      resourceId: documentId,
      outcome: 'SUCCESS',
      data: { absenceId: id, filename: document.filename },
    });

    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(document.filename)}"`);
    res.send(fileBuffer);
  } catch (error) {
    next(error);
  }
};

// Delete document
export const deleteAbsenceDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const { id, documentId } = req.params;

    const absence = await fetchAbsenceOr404(id);
    ensureAccess(absence, actor);

    const document = await prisma.absenceDocument.findFirst({
      where: { id: documentId, absenceId: id },
    });

    if (!document) {
      throw createError(404, 'Dokument nicht gefunden.');
    }

    // Remove file from storage
    await removeDocumentFile(document.storedAt);

    // Remove DB record
    await prisma.absenceDocument.delete({
      where: { id: documentId },
    });

    await submitAuditEvent(req, {
      action: 'ABSENCE.DOCUMENT.DELETE',
      resourceType: 'ABSENCE_DOCUMENT',
      resourceId: documentId,
      outcome: 'SUCCESS',
      data: { absenceId: id, filename: document.filename },
    });

    res.json({ success: true, message: 'Dokument gelöscht.' });
  } catch (error) {
    next(error);
  }
};
