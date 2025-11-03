import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import ExcelJS from 'exceljs';
import { streamCsv } from '../utils/csv';
import logger from '../utils/logger';


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
            securityConcepts: {
              where: { status: 'ACTIVE' },
              orderBy: { createdAt: 'desc' },
              take: 1,
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

    // Berechnung basierend auf assignments (nicht clearances!)
    const requiredStaff = site.requiredStaff || 1;
    const assignedStaff = site.assignments.length;
    const coveragePercentage = Math.min(100, Math.round((assignedStaff / requiredStaff) * 100));

    // Status-Logik: OK (>80%), WARNING (50-80%), CRITICAL (<50%)
    let status: 'OK' | 'WARNING' | 'CRITICAL';
    if (coveragePercentage >= 80) {
      status = 'OK';
    } else if (coveragePercentage >= 50) {
      status = 'WARNING';
    } else {
      status = 'CRITICAL';
    }

    // Breakdown nach Rollen mit required vs assigned
    // Empfohlene Verteilung: 1 Objektleiter, ~30% Schichtleiter, Rest Mitarbeiter
    const requiredObjektleiter = 1;
    const requiredSchichtleiter = Math.max(1, Math.ceil(requiredStaff * 0.3));
    const requiredMitarbeiter = Math.max(0, requiredStaff - requiredObjektleiter - requiredSchichtleiter);

    const assignedObjektleiter = site.assignments.filter((a) => a.role === 'OBJEKTLEITER').length;
    const assignedSchichtleiter = site.assignments.filter((a) => a.role === 'SCHICHTLEITER').length;
    const assignedMitarbeiter = site.assignments.filter((a) => a.role === 'MITARBEITER').length;

    const breakdown = [
      {
        role: 'OBJEKTLEITER',
        required: requiredObjektleiter,
        assigned: assignedObjektleiter,
        percentage: Math.min(100, Math.round((assignedObjektleiter / requiredObjektleiter) * 100)),
      },
      {
        role: 'SCHICHTLEITER',
        required: requiredSchichtleiter,
        assigned: assignedSchichtleiter,
        percentage: requiredSchichtleiter > 0
          ? Math.min(100, Math.round((assignedSchichtleiter / requiredSchichtleiter) * 100))
          : 0,
      },
      {
        role: 'MITARBEITER',
        required: requiredMitarbeiter,
        assigned: assignedMitarbeiter,
        percentage: requiredMitarbeiter > 0
          ? Math.min(100, Math.round((assignedMitarbeiter / requiredMitarbeiter) * 100))
          : 0,
      },
    ];

    res.json({
      success: true,
      data: {
        siteId: id,
        siteName: site.name,
        requiredStaff,
        assignedStaff,
        coveragePercentage,
        status,
        breakdown,
        // Legacy-Felder für Abwärtskompatibilität
        activeClearances: site.clearances.length,
        coveragePercent: coveragePercentage, // Deprecated: Nutze coveragePercentage
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/sites/:id/check-qualification - Qualifikations-Abgleich für User
export const checkUserQualification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ success: false, message: 'userId ist erforderlich' });
      return;
    }

    // Site mit erforderlichen Qualifikationen laden
    const site = await prisma.site.findUnique({
      where: { id },
      select: { id: true, name: true, requiredQualifications: true },
    });

    if (!site) {
      res.status(404).json({ success: false, message: 'Site nicht gefunden' });
      return;
    }

    // User mit Qualifikationen laden
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        qualifications: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'Benutzer nicht gefunden' });
      return;
    }

    const requiredQualifications = site.requiredQualifications as string[] || [];
    const userQualifications = user.qualifications || [];

    // Abgleich: Welche Qualifikationen hat der User, welche fehlen?
    const hasQualifications = requiredQualifications.filter((req) => userQualifications.includes(req));
    const missingQualifications = requiredQualifications.filter((req) => !userQualifications.includes(req));

    // Status bestimmen
    let status: 'FULL' | 'PARTIAL' | 'NONE';
    if (requiredQualifications.length === 0) {
      // Keine Qualifikationen erforderlich
      status = 'FULL';
    } else if (missingQualifications.length === 0) {
      // Alle Qualifikationen vorhanden
      status = 'FULL';
    } else if (hasQualifications.length > 0) {
      // Teilweise Qualifikationen vorhanden
      status = 'PARTIAL';
    } else {
      // Keine der erforderlichen Qualifikationen vorhanden
      status = 'NONE';
    }

    res.json({
      success: true,
      data: {
        siteId: site.id,
        siteName: site.name,
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        required: requiredQualifications,
        has: hasQualifications,
        missing: missingQualifications,
        status,
        allowOverride: status !== 'FULL', // Override möglich wenn nicht alle Qualifikationen vorhanden
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/sites/:id/assignment-candidates - Intelligente MA-Vorschläge für Zuweisung
export const getAssignmentCandidates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const role = req.query.role as string | undefined;

    // Site laden
    const site = await prisma.site.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        requiredQualifications: true,
        assignments: { select: { userId: true } },
        clearances: { where: { status: { in: ['ACTIVE', 'TRAINING'] } }, select: { userId: true, status: true } },
      },
    });

    if (!site) {
      res.status(404).json({ success: false, message: 'Site nicht gefunden' });
      return;
    }

    const requiredQualifications = site.requiredQualifications as string[] || [];
    const assignedUserIds = site.assignments.map((a) => a.userId);

    // Alle aktiven Mitarbeiter laden (außer bereits zugewiesene)
    const candidates = await prisma.user.findMany({
      where: {
        isActive: true,
        id: { notIn: assignedUserIds },
        ...(role && { role: role as any }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        qualifications: true,
      },
    });

    // Scoring für jeden Kandidaten
    const scoredCandidates = candidates.map((user) => {
      const userQualifications = user.qualifications || [];

      const hasQualifications = requiredQualifications.filter((req) => userQualifications.includes(req));
      const missingQualifications = requiredQualifications.filter((req) => !userQualifications.includes(req));

      // Qualifikations-Score (0-50%)
      const qualificationScore = requiredQualifications.length > 0
        ? (hasQualifications.length / requiredQualifications.length) * 50
        : 50;

      // Clearance-Score (0-30%)
      const clearance = site.clearances.find((c) => c.userId === user.id);
      let clearanceScore = 0;
      if (clearance) {
        clearanceScore = clearance.status === 'ACTIVE' ? 30 : 15; // ACTIVE = 30%, TRAINING = 15%
      }

      // Verfügbarkeits-Score (0-20%) - Placeholder: Immer 20%
      const availabilityScore = 20;

      // Gesamt-Score (0-100%)
      const totalScore = Math.round(qualificationScore + clearanceScore + availabilityScore);

      return {
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        qualifications: {
          required: requiredQualifications,
          has: hasQualifications,
          missing: missingQualifications,
          status: missingQualifications.length === 0 ? 'FULL' : hasQualifications.length > 0 ? 'PARTIAL' : 'NONE',
        },
        clearance: clearance
          ? { status: clearance.status, score: clearanceScore }
          : { status: 'NONE', score: 0 },
        score: totalScore,
      };
    });

    // Sortieren nach Score (höchste zuerst)
    scoredCandidates.sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      data: {
        siteId: site.id,
        siteName: site.name,
        requiredQualifications,
        candidates: scoredCandidates,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/sites/:id/generate-shifts - Schichten generieren
export const generateShiftsForSite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { startDate, daysAhead = 30 } = req.body;

    // Site laden
    const site = await prisma.site.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        requiredStaff: true,
        requiredQualifications: true,
        securityConcept: true, // Legacy JSON-Feld
      },
    });

    if (!site) {
      res.status(404).json({ success: false, message: 'Site nicht gefunden' });
      return;
    }

    // Versuche zuerst das neueste aktive Sicherheitskonzept aus der Tabelle zu laden
    let securityConceptData: any = null;
    const activeConceptFromDB = await prisma.securityConcept.findFirst({
      where: {
        siteId: id,
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (activeConceptFromDB && activeConceptFromDB.shiftModel) {
      // Neues System: Nutze SecurityConcept aus Tabelle
      securityConceptData = {
        shiftModel: activeConceptFromDB.shiftModel,
      };
    } else if (site.securityConcept) {
      // Fallback: Legacy JSON-Feld (für Abwärtskompatibilität)
      securityConceptData = site.securityConcept as any;
    }

    // Sicherheitskonzept prüfen
    if (!securityConceptData || !securityConceptData.shiftModel) {
      res.status(400).json({
        success: false,
        message: 'Kein aktives Sicherheitskonzept mit Schichtmodell vorhanden. Bitte erstellen Sie zuerst ein Sicherheitskonzept.',
      });
      return;
    }

    // Dynamischer Import von shiftGenerator
    const { generateShifts, getShiftGenerationStats } = await import('../utils/shiftGenerator');

    // Start-Datum validieren und parsen (immer auf Mitternacht setzen)
    let start: Date;
    if (startDate) {
      start = new Date(startDate);
    } else {
      // Kein Start-Datum angegeben → Heute um Mitternacht
      start = new Date();
      start.setHours(0, 0, 0, 0);
    }

    if (isNaN(start.getTime())) {
      res.status(400).json({ success: false, message: 'Ungültiges Start-Datum' });
      return;
    }

    // Stelle sicher dass Start-Zeit immer Mitternacht ist für konsistente Duplikat-Prüfung
    start.setHours(0, 0, 0, 0);

    // Schichtmodell extrahieren (neues Format: { model: "3-SHIFT", ... } oder legacy: "3-SHIFT")
    let shiftModelId: string;
    if (typeof securityConceptData.shiftModel === 'object' && securityConceptData.shiftModel !== null) {
      // Neues Format: { model: "3-SHIFT", hoursPerWeek: 168, shifts: [...] }
      shiftModelId = securityConceptData.shiftModel.model || '3-SHIFT';
    } else if (typeof securityConceptData.shiftModel === 'string') {
      // Legacy Format: "3-SHIFT"
      shiftModelId = securityConceptData.shiftModel;
    } else {
      // Fallback
      shiftModelId = '3-SHIFT';
    }

    // Schichten generieren
    const shiftsData = generateShifts({
      siteId: site.id,
      siteName: site.name,
      shiftModel: shiftModelId,
      requiredStaff: site.requiredStaff || 1,
      requiredQualifications: site.requiredQualifications || [],
      startDate: start,
      daysAhead: Math.min(Math.max(daysAhead, 1), 90), // Max 90 Tage
    });

    // Prüfe welche Schichten bereits existieren (manuelle Duplikat-Prüfung)
    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + Math.min(Math.max(daysAhead, 1), 90));

    const existingShifts = await prisma.shift.findMany({
      where: {
        siteId: site.id,
        startTime: {
          gte: start,
          lt: endDate,
        },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        title: true,
      },
    });

    // Erstelle Set für schnelle Duplikat-Prüfung
    // Duplikat = gleiche siteId + startTime + endTime + title
    const existingShiftKeys = new Set(
      existingShifts.map((shift) =>
        `${shift.startTime.toISOString()}_${shift.endTime.toISOString()}_${shift.title}`
      )
    );

    // Filtere nur neue Schichten (keine Duplikate)
    const newShifts = shiftsData.filter((shift) => {
      const key = `${shift.startTime.toISOString()}_${shift.endTime.toISOString()}_${shift.title}`;
      return !existingShiftKeys.has(key);
    });

    // Nur erstellen wenn es neue Schichten gibt
    let createdCount = 0;
    if (newShifts.length > 0) {
      const result = await prisma.shift.createMany({
        data: newShifts,
      });
      createdCount = result.count;
    }

    // Statistiken
    const stats = getShiftGenerationStats(shiftsData);
    const duplicateCount = shiftsData.length - newShifts.length;

    // Intelligente Nachricht basierend auf Ergebnis
    let message: string;
    let status: number;

    if (createdCount === 0 && existingShifts.length > 0) {
      message = `Keine neuen Schichten erstellt. Für diesen Zeitraum existieren bereits ${existingShifts.length} Schichten. Alle ${shiftsData.length} generierten Schichten sind Duplikate.`;
      status = 200;
    } else if (createdCount === 0) {
      message = 'Keine Schichten erstellt. Bitte überprüfen Sie das Schichtmodell.';
      status = 200;
    } else if (duplicateCount > 0) {
      message = `${createdCount} neue Schichten erstellt. ${duplicateCount} Duplikate wurden übersprungen (bereits vorhanden).`;
      status = 201;
    } else {
      message = `${createdCount} Schichten erfolgreich generiert (basierend auf ${activeConceptFromDB ? 'aktivem Sicherheitskonzept' : 'Legacy-Konzept'})`;
      status = 201;
    }

    res.status(status).json({
      success: true,
      message,
      data: {
        created: createdCount,
        existing: existingShifts.length,
        duplicates: duplicateCount,
        attempted: shiftsData.length,
        stats,
        template: securityConceptData.shiftModel,
        source: activeConceptFromDB ? 'security_concept_table' : 'legacy_json',
      },
    });
  } catch (error: any) {
    if (error.message?.includes('Unbekanntes Schichtmodell')) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
};

// GET /api/sites/:id/control-round-suggestions - Intelligente Kontrollgang-Vorschläge
export const getControlRoundSuggestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Service dynamisch importieren
    const { generateControlRoundSuggestions } = await import('../services/controlRoundSuggestionService');

    const suggestions = await generateControlRoundSuggestions(id);

    res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error: any) {
    if (error.message?.includes('nicht gefunden')) {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    logger.error('Error in getControlRoundSuggestions:', error);
    next(error);
  }
};
