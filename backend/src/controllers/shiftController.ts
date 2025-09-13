import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import ExcelJS from 'exceljs';
import logger from '../utils/logger';
import { sendShiftChangedEmail } from '../services/emailService';
import { streamCsv } from '../utils/csv';

const EMAIL_FLAG = 'EMAIL_NOTIFY_SHIFTS';

function isEmailNotifyEnabled(): boolean {
  return process.env[EMAIL_FLAG] === 'true';
}

async function notifyAssignedUsers(shift: any, change: string): Promise<void> {
  if (!isEmailNotifyEnabled()) {
    logger.info('E-Mail-Shift-Notify deaktiviert (%s!=true). Nur Log.', EMAIL_FLAG);
    return;
  }
  const assignments = Array.isArray(shift?.assignments) ? shift.assignments : [];
  const emails: string[] = assignments
    .map((a: any) => a?.user?.email)
    .filter((e: any): e is string => typeof e === 'string' && e.length > 0);
  if (emails.length === 0) {
    logger.info('Keine Empfänger für Schichtbenachrichtigung gefunden (keine Zuweisungen).');
    return;
  }
  await Promise.all(
    emails.map((to) =>
      sendShiftChangedEmail(to, shift.title || 'Schicht', change).catch((err) =>
        logger.error('Fehler beim Versenden der Schicht-Mail an %s: %o', to, err),
      ),
    ),
  );
}


// GET /api/shifts - Alle Schichten abrufen
export const getAllShifts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(parseInt((req.query.page as string) || '1', 10), 1);
    const pageSizeRaw = parseInt((req.query.pageSize as string) || '20', 10);
    const pageSize = Math.min(Math.max(pageSizeRaw || 20, 1), 100);
    const sortBy = (req.query.sortBy as string) || 'startTime';
    const sortDir = (req.query.sortDir as string) === 'desc' ? 'desc' : 'asc';
    const filtersFromQueryParam = (req.query.filter as Record<string, string>) || {};
    const filters: Record<string, string> = { ...filtersFromQueryParam };
    const rawQuery = req.query as Record<string, unknown>;
    for (const key of Object.keys(rawQuery)) {
      const m = key.match(/^filter\[(.+)\]$/);
      if (m) filters[m[1]] = String(rawQuery[key] as any);
    }

    const allowedSortFields = ['startTime', 'endTime', 'title', 'location', 'status', 'createdAt', 'updatedAt'];
    if (sortBy && !allowedSortFields.includes(sortBy)) {
      res.status(400).json({ success: false, message: `Ungültiges Sortierfeld: ${sortBy}`, allowed: allowedSortFields });
      return;
    }

    const where: any = {};
    if (filters) {
      if (typeof filters.title === 'string' && filters.title) where.title = { contains: filters.title, mode: 'insensitive' };
      if (typeof filters.location === 'string' && filters.location)
        where.location = { contains: filters.location, mode: 'insensitive' };
      if (typeof filters.status === 'string' && filters.status) where.status = filters.status as any;
      if (typeof filters.userId === 'string' && filters.userId) {
        where.assignments = { some: { userId: filters.userId } };
      }
    }

    const total = await prisma.shift.count({ where });
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);
    const skip = (page - 1) * pageSize;
    const data = await prisma.shift.findMany({
      where,
      orderBy: { [sortBy]: sortDir as any },
      skip,
      take: pageSize,
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true,
                phone: true,
                qualifications: true,
              },
            },
          },
        },
      },
    });

    const accept = (req.headers['accept'] as string) || '';
    if (accept.includes('text/csv')) {
      const header = ['id','siteId','title','location','startTime','endTime','requiredEmployees','status','createdAt','updatedAt'];
      async function* rows() {
        for (const sh of data as any[]) {
          yield {
            id: sh.id,
            siteId: sh.siteId || '',
            title: sh.title,
            location: sh.location,
            startTime: new Date(sh.startTime).toISOString(),
            endTime: new Date(sh.endTime).toISOString(),
            requiredEmployees: sh.requiredEmployees,
            status: sh.status,
            createdAt: new Date(sh.createdAt).toISOString(),
            updatedAt: new Date(sh.updatedAt).toISOString(),
          } as Record<string, unknown>;
        }
      }
      await streamCsv(res, 'shifts.csv', header, rows());
      return;
    }
    if (accept.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('shifts');
      const header = [
        'id',
        'siteId',
        'title',
        'location',
        'startTime',
        'endTime',
        'requiredEmployees',
        'status',
        'createdAt',
        'updatedAt',
      ];
      ws.addRow(header);
      for (const sh of data as any[]) {
        ws.addRow([
          sh.id,
          sh.siteId || '',
          sh.title,
          sh.location,
          new Date(sh.startTime).toISOString(),
          new Date(sh.endTime).toISOString(),
          sh.requiredEmployees,
          sh.status,
          new Date(sh.createdAt).toISOString(),
          new Date(sh.updatedAt).toISOString(),
        ]);
      }
      const buffer = Buffer.from(await wb.xlsx.writeBuffer());
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="shifts.xlsx"');
      res.setHeader('Content-Length', String(buffer.length));
      res.status(200).end(buffer);
      return;
    }

    res.json({ data, pagination: { page, pageSize, total, totalPages }, sort: { by: sortBy, dir: sortDir }, filters: Object.keys(where).length ? filters : undefined });
    return;
  } catch (error) {
    console.error('Error fetching shifts from database:', error);
    next(error);
    return;
  }
};

// GET /api/sites/:siteId/shifts – Schichten einer Site (JSON Array oder CSV/XLSX)
export const getShiftsForSite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { siteId } = req.params as { siteId: string };
    const data = await prisma.shift.findMany({
      where: { siteId },
      orderBy: { startTime: 'asc' },
      include: { assignments: false },
    });

    const accept = (req.headers['accept'] as string) || '';
    if (accept.includes('text/csv')) {
      const header = ['id','siteId','title','location','startTime','endTime','requiredEmployees','status'];
      async function* rows() {
        for (const sh of data as any[]) {
          yield {
            id: sh.id,
            siteId: sh.siteId || '',
            title: sh.title,
            location: sh.location,
            startTime: new Date(sh.startTime).toISOString(),
            endTime: new Date(sh.endTime).toISOString(),
            requiredEmployees: sh.requiredEmployees,
            status: sh.status,
          } as Record<string, unknown>;
        }
      }
      await streamCsv(res, `site_${siteId}_shifts.csv`, header, rows());
      return;
    }
    if (accept.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('shifts');
      const header = ['id', 'siteId', 'title', 'location', 'startTime', 'endTime', 'requiredEmployees', 'status'];
      ws.addRow(header);
      for (const sh of data as any[]) {
        ws.addRow([
          sh.id,
          sh.siteId || '',
          sh.title,
          sh.location,
          new Date(sh.startTime).toISOString(),
          new Date(sh.endTime).toISOString(),
          sh.requiredEmployees,
          sh.status,
        ]);
      }
      const buffer = Buffer.from(await wb.xlsx.writeBuffer());
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="site_${siteId}_shifts.xlsx"`);
      res.setHeader('Content-Length', String(buffer.length));
      res.status(200).end(buffer);
      return;
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
};

// POST /api/shifts - Neue Schicht erstellen
export const createShift = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      title,
      description,
      location,
      startTime,
      endTime,
      requiredEmployees = 1,
      requiredQualifications = [],
    } = req.body;

    // Validation
    if (!title || !location || !startTime || !endTime) {
      res.status(400).json({
        success: false,
        message: 'Titel, Ort, Start- und Endzeit sind erforderlich',
      });
      return;
    }

    // Zeitvalidierung
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      res.status(400).json({
        success: false,
        message: 'Startzeit muss vor der Endzeit liegen',
      });
      return;
    }

    const shift = await prisma.shift.create({
      data: {
        title,
        description,
        location,
        startTime: start,
        endTime: end,
        requiredEmployees: parseInt(requiredEmployees),
        requiredQualifications: Array.isArray(requiredQualifications) ? requiredQualifications : [],
      },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true,
                email: true,
              },
            },
          },
        },
      },
    });
    // E-Mail-Benachrichtigung (Feature-Flag)
    try {
      await notifyAssignedUsers(shift, 'erstellt');
    } catch {
      // bereits intern geloggt
    }
    res.status(201).json({
      success: true,
      message: 'Schicht erfolgreich erstellt',
      data: shift,
    });
  } catch (error) {
    console.error('Error creating shift:', error);
    next(error);
  }
};

// GET /api/shifts/:id - Einzelne Schicht abrufen
export const getShiftById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const shift = await prisma.shift.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true,
                phone: true,
                qualifications: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!shift) {
      res.status(404).json({
        success: false,
        message: 'Schicht nicht gefunden',
      });
      return;
    }

    res.json({
      success: true,
      message: `Schicht "${shift.title}" geladen`,
      data: shift,
    });
  } catch (error) {
    console.error('Error fetching shift:', error);
    next(error);
  }
};

// PUT /api/shifts/:id - Schicht aktualisieren
export const updateShift = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      location,
      startTime,
      endTime,
      requiredEmployees,
      requiredQualifications,
      status,
    } = req.body;

    // Zeitvalidierung falls beide Zeiten angegeben werden
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (start >= end) {
        res.status(400).json({
          success: false,
          message: 'Startzeit muss vor der Endzeit liegen',
        });
        return;
      }
    }

    const updatedShift = await prisma.shift.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(location && { location }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(requiredEmployees && { requiredEmployees: parseInt(requiredEmployees) }),
        ...(requiredQualifications && {
          requiredQualifications: Array.isArray(requiredQualifications)
            ? requiredQualifications
            : [],
        }),
        ...(status && { status: status as any }),
      },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true,
                email: true,
              },
            },
          },
        },
      },
    });
    // E-Mail-Benachrichtigung (Feature-Flag)
    try {
      await notifyAssignedUsers(updatedShift, 'aktualisiert');
    } catch {
      // bereits intern geloggt
    }
    res.json({
      success: true,
      message: 'Schicht erfolgreich aktualisiert',
      data: updatedShift,
    });
  } catch (error: any) {
    console.error('Error updating shift:', error);

    if (error.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'Schicht nicht gefunden',
      });
      return;
    }

    next(error);
  }
};

// DELETE /api/shifts/:id - Schicht löschen
export const deleteShift = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    // Empfänger vor Löschen ermitteln
    let shiftForNotify: any = null;
    try {
      shiftForNotify = await prisma.shift.findUnique({
        where: { id },
        include: {
          assignments: {
            include: {
              user: { select: { id: true, email: true, firstName: true, lastName: true, employeeId: true } },
            },
          },
        },
      });
    } catch {
      // ignore; Benachrichtigung optional
    }
    // Erst alle Zuweisungen löschen
    await prisma.shiftAssignment.deleteMany({
      where: { shiftId: id },
    });

    // Dann die Schicht löschen
    const deletedShift = await prisma.shift.delete({
      where: { id },
    });
    // E-Mail-Benachrichtigung (Feature-Flag)
    try {
      if (shiftForNotify) {
        await notifyAssignedUsers({ ...shiftForNotify, title: shiftForNotify.title || deletedShift.title }, 'gelöscht');
      }
    } catch {
      // bereits intern geloggt
    }
    res.json({
      success: true,
      message: 'Schicht erfolgreich gelöscht',
      data: { id: deletedShift.id, title: deletedShift.title },
    });
  } catch (error: any) {
    console.error('Error deleting shift:', error);

    if (error.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'Schicht nicht gefunden',
      });
      return;
    }

    next(error);
  }
};

// POST /api/shifts/:id/assign - Mitarbeiter zur Schicht zuweisen
export const assignUserToShift = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: shiftId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'Benutzer-ID ist erforderlich',
      });
      return;
    }

    // Prüfen ob Schicht existiert
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: { assignments: true },
    });

    if (!shift) {
      res.status(404).json({
        success: false,
        message: 'Schicht nicht gefunden',
      });
      return;
    }

    // Prüfen ob bereits zugewiesen
    const existingAssignment = await prisma.shiftAssignment.findUnique({
      where: {
        userId_shiftId: {
          userId,
          shiftId,
        },
      },
    });

    if (existingAssignment) {
      res.status(400).json({
        success: false,
        message: 'Mitarbeiter ist bereits dieser Schicht zugewiesen',
      });
      return;
    }

    // Zuweisung erstellen
    const assignment = await prisma.shiftAssignment.create({
      data: {
        userId,
        shiftId,
        status: 'ASSIGNED',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
          },
        },
        shift: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Mitarbeiter erfolgreich zur Schicht zugewiesen',
      data: assignment,
    });
  } catch (error: any) {
    console.error('Error assigning user to shift:', error);

    if (error.code === 'P2002') {
      res.status(400).json({
        success: false,
        message: 'Mitarbeiter ist bereits dieser Schicht zugewiesen',
      });
      return;
    }

    next(error);
  }
};

// POST /api/shifts/:id/clock-in
export const clockIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: shiftId } = req.params;
    const userId = (req.user as any)?.id;
    const { at, location, notes } = req.body;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Nicht authentifiziert' });
      return;
    }
    const assigned = await prisma.shiftAssignment.findUnique({
      where: { userId_shiftId: { userId, shiftId } },
    });
    if (!assigned) {
      res.status(403).json({ success: false, message: 'Nicht für diese Schicht zugewiesen' });
      return;
    }
    const open = await prisma.timeEntry.findFirst({ where: { userId, endTime: null } });
    if (open) {
      res.status(400).json({ success: false, message: 'Es existiert bereits ein offener Zeiteintrag' });
      return;
    }
    const start = new Date(at);
    const entry = await prisma.timeEntry.create({
      data: { userId, shiftId, startTime: start, startLocation: location || null, notes: notes || null },
    });
    const warnings: string[] = [];
    const last = await prisma.timeEntry.findFirst({
      where: { userId, endTime: { not: null } },
      orderBy: { endTime: 'desc' },
    });
    if (last?.endTime) {
      const hoursRest = (start.getTime() - new Date(last.endTime).getTime()) / 3_600_000;
      if (hoursRest < 11) warnings.push('WARN_REST_PERIOD_LT_11H');
    }
    res.json({ success: true, message: 'Clock-in erfasst', data: entry, warnings });
  } catch (error) {
    next(error);
  }
};

// POST /api/shifts/:id/clock-out
export const clockOut = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: shiftId } = req.params;
    const userId = (req.user as any)?.id;
    const { at, breakTime, location, notes } = req.body;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Nicht authentifiziert' });
      return;
    }
    const assigned = await prisma.shiftAssignment.findUnique({
      where: { userId_shiftId: { userId, shiftId } },
    });
    if (!assigned) {
      res.status(403).json({ success: false, message: 'Nicht für diese Schicht zugewiesen' });
      return;
    }
    const open = await prisma.timeEntry.findFirst({ where: { userId, endTime: null }, orderBy: { startTime: 'desc' } });
    if (!open) {
      res.status(400).json({ success: false, message: 'Kein offener Zeiteintrag vorhanden' });
      return;
    }
    const end = new Date(at);
    const updated = await prisma.timeEntry.update({
      where: { id: open.id },
      data: {
        endTime: end,
        breakTime: typeof breakTime === 'number' ? breakTime : null,
        endLocation: location || null,
        notes: notes || open.notes || null,
      },
    });
    const warnings: string[] = [];
    const durationHours =
      (end.getTime() - new Date(updated.startTime).getTime()) / 3_600_000 - (updated.breakTime ? updated.breakTime / 60 : 0);
    if (durationHours > 12) warnings.push('WARN_SHIFT_GT_12H');
    if (durationHours > 10) warnings.push('WARN_SHIFT_GT_10H');
    res.json({ success: true, message: 'Clock-out erfasst', data: updated, warnings });
  } catch (error) {
    next(error);
  }
};
