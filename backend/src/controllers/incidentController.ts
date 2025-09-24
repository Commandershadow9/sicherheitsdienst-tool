import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import ExcelJS from 'exceljs';
import { streamCsv } from '../utils/csv';
import { submitAuditEvent } from '../utils/audit';

export const listIncidents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(parseInt((req.query.page as string) || '1', 10), 1);
    const pageSizeRaw = parseInt((req.query.pageSize as string) || '20', 10);
    const pageSize = Math.min(Math.max(pageSizeRaw || 20, 1), 100);
    const sortBy = (req.query.sortBy as string) || 'occurredAt';
    const sortDir = (req.query.sortDir as string) === 'desc' ? 'desc' : 'asc';
    const filtersFromQueryParam = (req.query.filter as Record<string, string>) || {} as any;
    const filters: Record<string, string> = { ...filtersFromQueryParam };
    const rawQuery = req.query as Record<string, unknown>;
    for (const key of Object.keys(rawQuery)) {
      const m = key.match(/^filter\[(.+)\]$/);
      if (m) filters[m[1]] = String(rawQuery[key] as any);
    }

    const allowedSortFields = ['occurredAt', 'createdAt', 'updatedAt', 'severity', 'status', 'title'];
    if (sortBy && !allowedSortFields.includes(sortBy)) {
      res.status(400).json({ success: false, message: `Ungültiges Sortierfeld: ${sortBy}`, allowed: allowedSortFields });
      return;
    }

    const where: any = {};
    if (filters) {
      if (typeof filters.title === 'string' && filters.title) where.title = { contains: filters.title, mode: 'insensitive' };
      if (typeof filters.location === 'string' && filters.location) where.location = { contains: filters.location, mode: 'insensitive' };
      if (typeof filters.severity === 'string' && filters.severity) where.severity = filters.severity as any;
      if (typeof filters.status === 'string' && filters.status) where.status = filters.status as any;
      if (typeof filters.reportedBy === 'string' && filters.reportedBy) where.reportedBy = filters.reportedBy;
      const range: any = {};
      if (typeof (filters as any).occurredAtFrom === 'string' && (filters as any).occurredAtFrom) {
        const d = new Date((filters as any).occurredAtFrom);
        if (!isNaN(d.getTime())) range.gte = d;
      }
      if (typeof (filters as any).occurredAtTo === 'string' && (filters as any).occurredAtTo) {
        const d = new Date((filters as any).occurredAtTo);
        if (!isNaN(d.getTime())) {
          d.setHours(23,59,59,999);
          range.lte = d;
        }
      }
      if (Object.keys(range).length) where.occurredAt = range;
    }

    const total = await prisma.incident.count({ where });
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);
    const skip = (page - 1) * pageSize;
    const data = await prisma.incident.findMany({ where, orderBy: { [sortBy]: sortDir as any }, skip, take: pageSize });

    const accept = (req.headers['accept'] as string) || '';
    if (accept.includes('text/csv')) {
      const header = ['id','title','description','severity','status','location','occurredAt','reportedBy','createdAt','updatedAt'];
      async function* rows() {
        for (const i of data as any[]) {
          yield {
            id: i.id,
            title: i.title,
            description: i.description || '',
            severity: i.severity,
            status: i.status,
            location: i.location,
            occurredAt: new Date(i.occurredAt).toISOString(),
            reportedBy: i.reportedBy,
            createdAt: new Date(i.createdAt).toISOString(),
            updatedAt: new Date(i.updatedAt).toISOString(),
          } as Record<string, unknown>;
        }
      }
      await streamCsv(res, 'incidents.csv', header, rows());
      return;
    }
    if (accept.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('incidents');
      const headerRow = ['id', 'title', 'description', 'severity', 'status', 'location', 'occurredAt', 'reportedBy', 'createdAt', 'updatedAt'];
      ws.addRow(headerRow);
      data.forEach((i: any) => {
        ws.addRow([
          i.id,
          i.title,
          i.description || '',
          i.severity,
          i.status,
          i.location,
          new Date(i.occurredAt).toISOString(),
          i.reportedBy,
          new Date(i.createdAt).toISOString(),
          new Date(i.updatedAt).toISOString(),
        ]);
      });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="incidents.xlsx"');
      await wb.xlsx.write(res);
      res.end();
      return;
    }

    res.json({
      data,
      pagination: { page, pageSize, total, totalPages },
      sort: { by: sortBy, dir: sortDir },
      filters,
    });
  } catch (err) { next(err); }
};

export const createIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req.user as any) || null;
    if (!user) {
      await submitAuditEvent(req, {
        action: 'INCIDENT.CREATE',
        resourceType: 'INCIDENT',
        resourceId: null,
        outcome: 'DENIED',
        data: { reason: 'UNAUTHENTICATED' },
      });
      res.status(401).json({ success: false, message: 'Authentifizierung erforderlich.' });
      return;
    }
    const userId = user.id;
    const { title, description, severity, location, occurredAt } = req.body;

    if (!title || !severity || !location || !occurredAt) {
      res.status(422).json({ success: false, message: 'Titel, Schweregrad, Ort und occurredAt sind erforderlich.' });
      return;
    }
    const occurred = new Date(occurredAt);
    if (Number.isNaN(occurred.getTime())) {
      res.status(422).json({ success: false, message: 'occurredAt ist kein gültiges Datum.' });
      return;
    }
    const created = await prisma.incident.create({
      data: {
        title,
        description: description || '',
        severity,
        status: 'OPEN',
        location,
        occurredAt: occurred,
        reportedBy: userId,
      },
    });
    if (!created || !(created as any).id) {
      await submitAuditEvent(req, {
        action: 'INCIDENT.CREATE.FAIL',
        resourceType: 'INCIDENT',
        resourceId: null,
        outcome: 'FAIL',
        data: { reason: 'CREATE_RETURNED_EMPTY' },
      });
      res.status(422).json({ success: false, message: 'Vorfall konnte nicht erstellt werden.' });
      return;
    }
    await submitAuditEvent(req, {
      action: 'INCIDENT.CREATE.SUCCESS',
      resourceType: 'INCIDENT',
      resourceId: (created as any).id,
      outcome: 'SUCCESS',
      data: {
        severity: (created as any).severity,
        status: (created as any).status,
        location: (created as any).location,
      },
    });
    res.status(201).json(created);
  } catch (err) {
    await submitAuditEvent(req, {
      action: 'INCIDENT.CREATE.ERROR',
      resourceType: 'INCIDENT',
      resourceId: null,
      outcome: 'ERROR',
      data: { error: err instanceof Error ? err.message : 'UNKNOWN_ERROR' },
    });
    next(err);
  }
};

export const getIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const found = await prisma.incident.findUnique({ where: { id } });
    if (!found) {
      res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Vorfall nicht gefunden.' });
      return;
    }
    res.json(found);
  } catch (err) { next(err); }
};

export const updateIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const payload: any = {};
    const fields: Array<keyof typeof req.body> = ['title', 'description', 'severity', 'status', 'location', 'occurredAt'];
    for (const f of fields) {
      if (req.body[f] !== undefined) payload[f] = f === 'occurredAt' ? new Date(req.body[f]) : req.body[f];
    }
    const updated = await prisma.incident.update({ where: { id }, data: payload });
    await submitAuditEvent(req, {
      action: 'INCIDENT.UPDATE.SUCCESS',
      resourceType: 'INCIDENT',
      resourceId: updated.id,
      outcome: 'SUCCESS',
      data: { changes: Object.keys(payload) },
    });
    res.json(updated);
  } catch (err: any) {
    if (err?.code === 'P2025') {
      await submitAuditEvent(req, {
        action: 'INCIDENT.UPDATE.FAIL',
        resourceType: 'INCIDENT',
        resourceId: req.params?.id ?? null,
        outcome: 'FAIL',
        data: { reason: 'NOT_FOUND' },
      });
      res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Vorfall nicht gefunden.' });
      return;
    }
    await submitAuditEvent(req, {
      action: 'INCIDENT.UPDATE.ERROR',
      resourceType: 'INCIDENT',
      resourceId: req.params?.id ?? null,
      outcome: 'ERROR',
      data: { error: err instanceof Error ? err.message : 'UNKNOWN_ERROR' },
    });
    next(err);
  }
};

export const deleteIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.incident.delete({ where: { id } });
    await submitAuditEvent(req, {
      action: 'INCIDENT.DELETE.SUCCESS',
      resourceType: 'INCIDENT',
      resourceId: id,
      outcome: 'SUCCESS',
    });
    res.status(204).send();
  } catch (err: any) {
    if (err?.code === 'P2025') {
      await submitAuditEvent(req, {
        action: 'INCIDENT.DELETE.FAIL',
        resourceType: 'INCIDENT',
        resourceId: req.params?.id ?? null,
        outcome: 'FAIL',
        data: { reason: 'NOT_FOUND' },
      });
      res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Vorfall nicht gefunden.' });
      return;
    }
    await submitAuditEvent(req, {
      action: 'INCIDENT.DELETE.ERROR',
      resourceType: 'INCIDENT',
      resourceId: req.params?.id ?? null,
      outcome: 'ERROR',
      data: { error: err instanceof Error ? err.message : 'UNKNOWN_ERROR' },
    });
    next(err);
  }
};
