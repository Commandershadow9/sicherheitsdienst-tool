import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import ExcelJS from 'exceljs';

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
    }

    const total = await prisma.incident.count({ where });
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);
    const skip = (page - 1) * pageSize;
    const data = await prisma.incident.findMany({ where, orderBy: { [sortBy]: sortDir as any }, skip, take: pageSize });

    const accept = (req.headers['accept'] as string) || '';
    if (accept.includes('text/csv')) {
      const rows = data.map((i: any) => ({
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
      }));
      const header = Object.keys(rows[0] || { id: '', title: '', description: '', severity: '', status: '', location: '', occurredAt: '', reportedBy: '', createdAt: '', updatedAt: '' });
      const escape = (v: any) => {
        const s = String(v ?? '');
        if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
        return s;
      };
      const csv = [header.join(','), ...rows.map((r) => header.map((h) => escape((r as any)[h])).join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="incidents.csv"');
      res.status(200).send(csv);
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
    const userId = (req.user as any)?.id;
    const { title, description, severity, location, occurredAt } = req.body;
    const created = await prisma.incident.create({
      data: {
        title,
        description: description || '',
        severity,
        status: 'OPEN',
        location,
        occurredAt: new Date(occurredAt),
        reportedBy: userId,
      },
    });
    res.status(201).json(created);
  } catch (err) { next(err); }
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
    res.json(updated);
  } catch (err: any) {
    if (err?.code === 'P2025') {
      res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Vorfall nicht gefunden.' });
      return;
    }
    next(err);
  }
};

export const deleteIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.incident.delete({ where: { id } });
    res.status(204).send();
  } catch (err: any) {
    if (err?.code === 'P2025') {
      res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Vorfall nicht gefunden.' });
      return;
    }
    next(err);
  }
};

