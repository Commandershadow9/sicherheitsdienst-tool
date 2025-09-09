import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import { sendPushToUsers } from '../services/pushService';
import { generateEventPdf } from '../services/pdfService';

const prisma = new PrismaClient();

function acceptHeader(req: Request): string {
  return (req.headers['accept'] as string) || '';
}

async function ensureUsersExist(ids: string[]): Promise<void> {
  if (!ids || ids.length === 0) return;
  const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true } });
  if (users.length !== ids.length) {
    throw Object.assign(new Error('Ein oder mehrere Mitarbeiter-IDs existieren nicht'), {
      status: 400,
      code: 'BAD_REQUEST',
    });
  }
}

export const listEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(parseInt((req.query.page as string) || '1', 10), 1);
    const pageSizeRaw = parseInt((req.query.pageSize as string) || '20', 10);
    const pageSize = Math.min(Math.max(pageSizeRaw || 20, 1), 100);
    const sortBy = (req.query.sortBy as string) || 'startTime';
    const sortDir = (req.query.sortDir as string) === 'desc' ? 'desc' : 'asc';
    const rawQuery = req.query as Record<string, unknown>;
    const filters: Record<string, string> = {};
    for (const key of Object.keys(rawQuery)) {
      const m = key.match(/^filter\[(.+)\]$/);
      if (m) filters[m[1]] = String(rawQuery[key] as any);
    }
    const allowedSortFields = ['startTime', 'endTime', 'title', 'createdAt', 'updatedAt'];
    if (sortBy && !allowedSortFields.includes(sortBy)) {
      res.status(400).json({ success: false, message: `Ungültiges Sortierfeld: ${sortBy}`, allowed: allowedSortFields });
      return;
    }
    const where: any = {};
    if (filters.title) where.title = { contains: filters.title, mode: 'insensitive' };
    if (filters.siteId) where.siteId = filters.siteId;
    if (filters.status) where.status = filters.status;

    const total = await (prisma as any).event.count({ where });
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);
    const skip = (page - 1) * pageSize;
    const data = await (prisma as any).event.findMany({ where, orderBy: { [sortBy]: sortDir as any }, skip, take: pageSize });

    const accept = acceptHeader(req);
    if (accept.includes('text/csv')) {
      const rows = (data as any[]).map((e: any) => ({
        id: e.id,
        title: e.title,
        siteId: e.siteId || '',
        startTime: e.startTime.toISOString(),
        endTime: e.endTime.toISOString(),
        status: e.status,
      }));
      const header = Object.keys(rows[0] || { id: '', title: '', siteId: '', startTime: '', endTime: '', status: '' });
      const escape = (v: any) => {
        const s = String(v ?? '');
        if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
        return s;
      };
      const csv = [header.join(','), ...rows.map((r: any) => header.map((h) => escape((r as any)[h])).join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="events.csv"');
      res.status(200).send(csv);
      return;
    }
    if (accept.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('events');
      const header = ['id', 'title', 'siteId', 'startTime', 'endTime', 'status'];
      ws.addRow(header);
      for (const e of data) {
        ws.addRow([e.id, e.title, e.siteId || '', e.startTime.toISOString(), e.endTime.toISOString(), e.status]);
      }
      const buffer = await wb.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="events.xlsx"');
      res.status(200).send(Buffer.from(buffer));
      return;
    }

    res.json({ data, pagination: { page, pageSize, total, totalPages }, sort: { by: sortBy, dir: sortDir }, filters: Object.keys(where).length ? filters : undefined });
  } catch (err) {
    next(err);
  }
};

export const createEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, siteId, startTime, endTime, serviceInstructions, assignedEmployeeIds = [] } = req.body;
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (!(start < end)) {
      res.status(400).json({ success: false, message: 'Startzeit muss vor der Endzeit liegen' });
      return;
    }
    await ensureUsersExist(assignedEmployeeIds);
    const e = await (prisma as any).event.create({
      data: { title, description, siteId: siteId || null, startTime: start, endTime: end, serviceInstructions, assignedEmployeeIds },
    });
    try {
      if (String(process.env.PUSH_NOTIFY_EVENTS || 'false').toLowerCase() === 'true' && assignedEmployeeIds.length) {
        await sendPushToUsers(assignedEmployeeIds, `Neuer Einsatz: ${title}`, serviceInstructions.slice(0, 140));
      }
    } catch {
      // Push ist best-effort; Fehler werden geloggt im Service
    }
    res.status(201).json(e);
    return;
  } catch (err) {
    next(err);
    return;
  }
};

export const getEventById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const e = await (prisma as any).event.findUnique({ where: { id } });
    if (!e) { res.status(404).json({ success: false, message: 'Event nicht gefunden' }); return; }
    // Optional PDF via Accept
    const accept = (req.headers['accept'] as string) || '';
    if (accept.includes('application/pdf')) {
      // Zusatzdaten: Site + eingesetzte Mitarbeiter auflösen
      let site: any = null;
      if (e.siteId) {
        site = await prisma.site.findUnique({ where: { id: e.siteId }, select: { name: true, address: true, city: true, postalCode: true } });
      }
      let assignedEmployees: any[] = [];
      if (Array.isArray(e.assignedEmployeeIds) && e.assignedEmployeeIds.length) {
        assignedEmployees = await prisma.user.findMany({
          where: { id: { in: e.assignedEmployeeIds as any } },
          select: { firstName: true, lastName: true, employeeId: true, role: true },
        });
      }
      const pdf = await generateEventPdf({ ...e, site, assignedEmployees });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="event_${id}.pdf"`);
      res.status(200).send(pdf);
      return;
    }
    res.json(e);
    return;
  } catch (err) {
    next(err);
    return;
  }
};

export const updateEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, siteId, startTime, endTime, serviceInstructions, assignedEmployeeIds, status } = req.body;
    if (startTime && endTime) {
      const s = new Date(startTime);
      const e = new Date(endTime);
      if (!(s < e)) {
        res.status(400).json({ success: false, message: 'Startzeit muss vor der Endzeit liegen' });
        return;
      }
    }
    if (assignedEmployeeIds) await ensureUsersExist(assignedEmployeeIds);
    const updated = await (prisma as any).event.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(siteId !== undefined && { siteId }),
        ...(startTime !== undefined && { startTime: new Date(startTime) }),
        ...(endTime !== undefined && { endTime: new Date(endTime) }),
        ...(serviceInstructions !== undefined && { serviceInstructions }),
        ...(assignedEmployeeIds !== undefined && { assignedEmployeeIds }),
        ...(status !== undefined && { status }),
      },
    });
    try {
      const ids = assignedEmployeeIds || [];
      if (String(process.env.PUSH_NOTIFY_EVENTS || 'false').toLowerCase() === 'true' && ids.length) {
        await sendPushToUsers(ids, `Einsatz aktualisiert: ${updated.title}`, (updated.serviceInstructions || '').slice(0, 140));
      }
    } catch {}
    res.json(updated);
    return;
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Event nicht gefunden' });
      return;
    }
    next(err);
    return;
  }
};

export const deleteEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await (prisma as any).event.delete({ where: { id } });
    res.status(204).send();
    return;
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Event nicht gefunden' });
      return;
    }
    next(err);
    return;
  }
};
