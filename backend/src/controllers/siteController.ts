import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import ExcelJS from 'exceljs';


// GET /api/sites - Alle Sites
export const getAllSites = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(parseInt((req.query.page as string) || '1', 10), 1);
    const pageSizeRaw = parseInt((req.query.pageSize as string) || '20', 10);
    const pageSize = Math.min(Math.max(pageSizeRaw || 20, 1), 100);
    const sortBy = (req.query.sortBy as string) || 'name';
    const sortDir = (req.query.sortDir as string) === 'desc' ? 'desc' : 'asc';
    const filtersFromQueryParam = (req.query.filter as Record<string, string>) || {};
    const filters: Record<string, string> = { ...filtersFromQueryParam };
    const rawQuery = req.query as Record<string, unknown>;
    for (const key of Object.keys(rawQuery)) {
      const m = key.match(/^filter\[(.+)\]$/);
      if (m) filters[m[1]] = String(rawQuery[key] as any);
    }

    const allowedSortFields = ['name', 'city', 'postalCode', 'createdAt', 'updatedAt'];
    if (sortBy && !allowedSortFields.includes(sortBy)) {
      res.status(400).json({ success: false, message: `Ungültiges Sortierfeld: ${sortBy}`, allowed: allowedSortFields });
      return;
    }

    const where: any = {};
    if (filters) {
      if (typeof filters.name === 'string' && filters.name) where.name = { contains: filters.name, mode: 'insensitive' };
      if (typeof filters.city === 'string' && filters.city) where.city = { contains: filters.city, mode: 'insensitive' };
      if (typeof filters.postalCode === 'string' && filters.postalCode)
        where.postalCode = { contains: filters.postalCode, mode: 'insensitive' };
    }

    const total = await prisma.site.count({ where });
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);
    const skip = (page - 1) * pageSize;
    const data = await prisma.site.findMany({ where, orderBy: { [sortBy]: sortDir as any }, skip, take: pageSize });

    const accept = (req.headers['accept'] as string) || '';
    if (accept.includes('text/csv')) {
      const rows = data.map((s: any) => ({
        id: s.id,
        name: s.name,
        address: s.address,
        city: s.city,
        postalCode: s.postalCode,
        createdAt: new Date(s.createdAt).toISOString(),
        updatedAt: new Date(s.updatedAt).toISOString(),
      }));
      const header = Object.keys(rows[0] || {
        id: '',
        name: '',
        address: '',
        city: '',
        postalCode: '',
        createdAt: '',
        updatedAt: '',
      });
      const escape = (v: any) => {
        const s = String(v ?? '');
        if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
        return s;
      };
      const csv = [header.join(','), ...rows.map((r) => header.map((h) => escape((r as any)[h])).join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="sites.csv"');
      res.status(200).send(csv);
      return;
    }
    if (accept.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('sites');
      const header = ['id', 'name', 'address', 'city', 'postalCode', 'createdAt', 'updatedAt'];
      ws.addRow(header);
      for (const s of data as any[]) {
        ws.addRow([
          s.id,
          s.name,
          s.address,
          s.city,
          s.postalCode,
          new Date(s.createdAt).toISOString(),
          new Date(s.updatedAt).toISOString(),
        ]);
      }
      const buffer = Buffer.from(await wb.xlsx.writeBuffer());
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="sites.xlsx"');
      res.setHeader('Content-Length', String(buffer.length));
      res.status(200).end(buffer);
      return;
    }

    res.json({
      data,
      pagination: { page, pageSize, total, totalPages },
      sort: { by: sortBy, dir: sortDir },
      filters: Object.keys(where).length ? filters : undefined,
    });
    return;
  } catch (error) {
    next(error);
    return;
  }
};

// POST /api/sites - Neue Site anlegen
export const createSite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, address, city, postalCode } = req.body;
    const site = await prisma.site.create({ data: { name, address, city, postalCode } });
    res.status(201).json({ success: true, message: 'Site erfolgreich erstellt', data: site });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      res.status(409).json({ success: false, message: 'Site existiert bereits (Name + Adresse muss eindeutig sein).' });
      return;
    }
    next(error);
  }
};

// GET /api/sites/:id - Einzelsite
export const getSiteById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const site = await prisma.site.findUnique({ where: { id } });
    if (!site) {
      res.status(404).json({ success: false, message: 'Site nicht gefunden' });
      return;
    }
    res.json({ success: true, message: 'Site geladen', data: site });
  } catch (error) {
    next(error);
  }
};

// PUT /api/sites/:id - Site aktualisieren
export const updateSite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, address, city, postalCode } = req.body;
    const updated = await prisma.site.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(postalCode !== undefined && { postalCode }),
      },
    });
    res.json({ success: true, message: 'Site aktualisiert', data: updated });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Site nicht gefunden' });
      return;
    }
    if (error?.code === 'P2002') {
      res.status(409).json({ success: false, message: 'Site existiert bereits (Name + Adresse muss eindeutig sein).' });
      return;
    }
    next(error);
  }
};

// DELETE /api/sites/:id - Site löschen
export const deleteSite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.site.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Site nicht gefunden' });
      return;
    }
    next(error);
  }
};
