import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import { AbsenceStatus, Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { submitAuditEvent } from '../utils/audit';
import { findReplacementCandidatesForShiftV2 } from '../services/replacementService';
import { getAffectedShiftsWithCapacity } from '../services/absenceCapacityService';
import { generateICS } from '../utils/icsGenerator';
import { canManage, ensureDate, PAGE_MAX } from './absenceShared';

/**
 * GET /api/absences/:id/replacement-candidates
 * Find replacement candidates for shifts affected by absence
 */
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

/**
 * GET /api/absences/export.ics
 * Export absences as ICS file (iCalendar format)
 *
 * Query parameters:
 * - userId: Filter by user (optional, EMPLOYEE sees only own)
 * - status: Filter by status (optional)
 * - from/to: Date range filter (optional)
 */
export const exportAbsencesToICS = async (req: Request, res: Response) => {
  const actor = req.user!;
  const q = req.query as Record<string, string | undefined>;

  const where: Prisma.AbsenceWhereInput = {};

  // Permissions: EMPLOYEE sees only own absences
  if (actor.role === 'EMPLOYEE') {
    where.userId = actor.id;
  } else if (q.userId) {
    where.userId = q.userId;
  }

  // Filter by status
  if (q.status && Object.values(AbsenceStatus).includes(q.status as AbsenceStatus)) {
    where.status = q.status as AbsenceStatus;
  }

  // Date range filter
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

  // Fetch absences
  const absences = await prisma.absence.findMany({
    where,
    select: {
      id: true,
      type: true,
      status: true,
      startsAt: true,
      endsAt: true,
      reason: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { startsAt: 'asc' },
  });

  // Calendar name
  const calendarName =
    where.userId && actor.role !== 'EMPLOYEE'
      ? `Abwesenheiten - ${absences[0]?.user.firstName || 'Mitarbeiter'}`
      : 'Meine Abwesenheiten';

  // Generate ICS
  const icsContent = generateICS(absences, calendarName);

  // Audit log
  await submitAuditEvent(req, {
    action: 'ABSENCE_EXPORT_ICS',
    resourceType: 'ABSENCE',
    outcome: 'SUCCESS',
    actorId: actor.id,
    data: { count: absences.length, filters: q },
  });

  // Response headers
  const filename = `abwesenheiten-${new Date().toISOString().split('T')[0]}.ics`;
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(icsContent);
};
