import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import ExcelJS from 'exceljs';
import { streamCsv } from '../utils/csv';


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
      if (typeof filters.status === 'string' && filters.status) where.status = filters.status;
      if (typeof filters.customerName === 'string' && filters.customerName)
        where.customerName = { contains: filters.customerName, mode: 'insensitive' };
      if (typeof filters.customerCompany === 'string' && filters.customerCompany)
        where.customerCompany = { contains: filters.customerCompany, mode: 'insensitive' };
    }

    const total = await prisma.site.count({ where });
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);
    const skip = (page - 1) * pageSize;
    const data = await prisma.site.findMany({ where, orderBy: { [sortBy]: sortDir as any }, skip, take: pageSize });

    const accept = (req.headers['accept'] as string) || '';
    if (accept.includes('text/csv')) {
      const header = ['id','name','address','city','postalCode','createdAt','updatedAt'];
      async function* rows() {
        for (const s of data as any[]) {
          yield {
            id: s.id,
            name: s.name,
            address: s.address,
            city: s.city,
            postalCode: s.postalCode,
            createdAt: new Date(s.createdAt).toISOString(),
            updatedAt: new Date(s.updatedAt).toISOString(),
          } as Record<string, unknown>;
        }
      }
      await streamCsv(res, 'sites.csv', header, rows());
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
    const {
      name,
      address,
      city,
      postalCode,
      customerName,
      customerCompany,
      customerEmail,
      customerPhone,
      emergencyContacts,
      status,
      requiredStaff,
      requiredQualifications,
      description,
      notes,
    } = req.body;

    const site = await prisma.site.create({
      data: {
        name,
        address,
        city,
        postalCode,
        ...(customerName !== undefined && { customerName }),
        ...(customerCompany !== undefined && { customerCompany }),
        ...(customerEmail !== undefined && { customerEmail }),
        ...(customerPhone !== undefined && { customerPhone }),
        ...(emergencyContacts !== undefined && { emergencyContacts }),
        ...(status !== undefined && { status }),
        ...(requiredStaff !== undefined && { requiredStaff }),
        ...(requiredQualifications !== undefined && { requiredQualifications }),
        ...(description !== undefined && { description }),
        ...(notes !== undefined && { notes }),
      },
    });

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
    const includeRelations = req.query.include === 'relations';

    const site = await prisma.site.findUnique({
      where: { id },
      include: includeRelations
        ? {
            images: { orderBy: { uploadedAt: 'desc' }, take: 10 },
            assignments: {
              include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
              orderBy: { assignedAt: 'desc' },
            },
            clearances: {
              where: { status: 'ACTIVE' },
              include: { user: { select: { id: true, firstName: true, lastName: true } } },
              orderBy: { createdAt: 'desc' },
            },
          }
        : undefined,
    });

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
    const {
      name,
      address,
      city,
      postalCode,
      customerName,
      customerCompany,
      customerEmail,
      customerPhone,
      emergencyContacts,
      status,
      requiredStaff,
      requiredQualifications,
      description,
      notes,
    } = req.body;

    const updated = await prisma.site.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(postalCode !== undefined && { postalCode }),
        ...(customerName !== undefined && { customerName }),
        ...(customerCompany !== undefined && { customerCompany }),
        ...(customerEmail !== undefined && { customerEmail }),
        ...(customerPhone !== undefined && { customerPhone }),
        ...(emergencyContacts !== undefined && { emergencyContacts }),
        ...(status !== undefined && { status }),
        ...(requiredStaff !== undefined && { requiredStaff }),
        ...(requiredQualifications !== undefined && { requiredQualifications }),
        ...(description !== undefined && { description }),
        ...(notes !== undefined && { notes }),
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

// ===== Bilder-Management =====

// GET /api/sites/:id/images - Alle Bilder eines Objekts
export const getSiteImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const category = req.query.category as any;

    const images = await prisma.siteImage.findMany({
      where: {
        siteId: id,
        ...(category && { category: category as any }),
      },
      include: { uploader: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { uploadedAt: 'desc' },
    });

    res.json({ success: true, data: images });
  } catch (error) {
    next(error);
  }
};

// POST /api/sites/:id/images - Bild hochladen (wird später mit Multer erweitert)
export const uploadSiteImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { filename, filePath, category, description, fileSize, mimeType } = req.body;
    const uploadedBy = req.user?.id;

    if (!uploadedBy) {
      res.status(401).json({ success: false, message: 'Nicht authentifiziert' });
      return;
    }

    const image = await prisma.siteImage.create({
      data: {
        siteId: id,
        filename,
        filePath,
        category: category || 'OTHER',
        description,
        fileSize,
        mimeType,
        uploadedBy,
      },
    });

    res.status(201).json({ success: true, message: 'Bild erfolgreich hochgeladen', data: image });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/sites/:siteId/images/:imageId - Bild löschen
export const deleteSiteImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imageId } = req.params;
    await prisma.siteImage.delete({ where: { id: imageId } });
    res.status(204).send();
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Bild nicht gefunden' });
      return;
    }
    next(error);
  }
};

// ===== Zuweisungen-Management =====

// GET /api/sites/:id/assignments - Alle Zuweisungen eines Objekts
export const getSiteAssignments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const role = req.query.role as any;

    const assignments = await prisma.siteAssignment.findMany({
      where: {
        siteId: id,
        ...(role && { role: role as any }),
      },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } },
      orderBy: { assignedAt: 'desc' },
    });

    res.json({ success: true, data: assignments });
  } catch (error) {
    next(error);
  }
};

// POST /api/sites/:id/assignments - Neue Zuweisung erstellen
export const createSiteAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;
    const assignedBy = req.user?.id;

    if (!assignedBy) {
      res.status(401).json({ success: false, message: 'Nicht authentifiziert' });
      return;
    }

    const assignment = await prisma.siteAssignment.create({
      data: {
        siteId: id,
        userId,
        role,
        assignedBy,
      },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });

    res.status(201).json({ success: true, message: 'Zuweisung erfolgreich erstellt', data: assignment });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      res.status(409).json({ success: false, message: 'Benutzer ist bereits für dieses Objekt zugewiesen' });
      return;
    }
    next(error);
  }
};

// DELETE /api/sites/:siteId/assignments/:assignmentId - Zuweisung löschen
export const deleteSiteAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assignmentId } = req.params;
    await prisma.siteAssignment.delete({ where: { id: assignmentId } });
    res.status(204).send();
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Zuweisung nicht gefunden' });
      return;
    }
    next(error);
  }
};

// GET /api/sites/:id/coverage-stats - Coverage-Statistiken
export const getSiteCoverageStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const site = await prisma.site.findUnique({
      where: { id },
      include: {
        clearances: { where: { status: 'ACTIVE' } },
        assignments: { include: { user: true } },
      },
    });

    if (!site) {
      res.status(404).json({ success: false, message: 'Site nicht gefunden' });
      return;
    }

    const activeClearances = site.clearances.length;
    const requiredStaff = site.requiredStaff || 1;
    const coveragePercent = Math.min(100, Math.round((activeClearances / requiredStaff) * 100));

    const assignments = {
      objektleiter: site.assignments.filter((a) => a.role === 'OBJEKTLEITER').length,
      schichtleiter: site.assignments.filter((a) => a.role === 'SCHICHTLEITER').length,
      mitarbeiter: site.assignments.filter((a) => a.role === 'MITARBEITER').length,
    };

    res.json({
      success: true,
      data: {
        siteId: id,
        siteName: site.name,
        requiredStaff,
        activeClearances,
        coveragePercent,
        assignments,
      },
    });
  } catch (error) {
    next(error);
  }
};
