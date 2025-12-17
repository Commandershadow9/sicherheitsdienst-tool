import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { Prisma } from '@prisma/client';

/**
 * SecurityConcept Controller
 *
 * Diese Controller-Version arbeitet mit dem JSON-Feld `securityConcept` im Site-Model,
 * da das separate SecurityConcept-Model noch nicht migriert wurde.
 *
 * Das securityConcept JSON-Feld enthält:
 * - tasks: string[] - Aufgaben
 * - intervals: string[] - Intervalle
 * - shiftModel: string - Schichtmodell (z.B. "2-SHIFT", "3-SHIFT")
 * - hoursPerWeek: number - Stunden pro Woche
 * - templateId: string - Template-ID
 * - templateName: string - Template-Name
 */

// GET /api/sites/:siteId/security-concept - Sicherheitskonzept eines Objekts abrufen
export const getSecurityConcept = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.params;

    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        postalCode: true,
        status: true,
        securityConcept: true,
        requiredStaff: true,
        requiredQualifications: true,
      },
    });

    if (!site) {
      res.status(404).json({ success: false, message: 'Objekt nicht gefunden' });
      return;
    }

    if (!site.securityConcept) {
      res.status(404).json({ success: false, message: 'Kein Sicherheitskonzept für dieses Objekt definiert' });
      return;
    }

    res.json({
      success: true,
      data: {
        siteId: site.id,
        siteName: site.name,
        ...site.securityConcept as object,
        requiredStaff: site.requiredStaff,
        requiredQualifications: site.requiredQualifications,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/sites/:siteId/security-concepts - Alias für getSecurityConcept (Kompatibilität)
export const getAllSecurityConcepts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.params;

    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: {
        id: true,
        name: true,
        securityConcept: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    if (!site) {
      res.status(404).json({ success: false, message: 'Objekt nicht gefunden' });
      return;
    }

    // Da wir nur ein JSON-Feld haben, geben wir es als Array mit einem Element zurück
    const concepts = site.securityConcept ? [{
      id: site.id, // Verwende Site-ID als Konzept-ID
      siteId: site.id,
      ...site.securityConcept as object,
      status: 'ACTIVE',
      version: '1.0',
      createdAt: site.createdAt,
      updatedAt: site.updatedAt,
    }] : [];

    res.json({ success: true, data: concepts, count: concepts.length });
  } catch (error) {
    next(error);
  }
};

// GET /api/sites/:siteId/security-concept/:id - Einzelnes Konzept (gleich wie getSecurityConcept)
export const getSecurityConceptById = async (req: Request, res: Response, next: NextFunction) => {
  // Da wir nur ein JSON-Feld haben, leiten wir an getSecurityConcept weiter
  return getSecurityConcept(req, res, next);
};

// POST /api/sites/:siteId/security-concept - Sicherheitskonzept erstellen/aktualisieren
export const createSecurityConcept = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.params;
    const {
      tasks,
      intervals,
      shiftModel,
      hoursPerWeek,
      templateId,
      templateName,
      staffRequirements,
      riskAssessment,
      emergencyPlan,
      notes,
    } = req.body;

    // Prüfe ob Site existiert
    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      res.status(404).json({ success: false, message: 'Objekt nicht gefunden' });
      return;
    }

    // Erstelle das Sicherheitskonzept-Objekt
    const securityConceptData = {
      tasks: tasks || [],
      intervals: intervals || [],
      shiftModel: shiftModel || '3-SHIFT',
      hoursPerWeek: hoursPerWeek || 168,
      templateId,
      templateName,
      staffRequirements,
      riskAssessment,
      emergencyPlan,
      notes,
      updatedAt: new Date().toISOString(),
    };

    // Update Site mit neuem Sicherheitskonzept
    const updatedSite = await prisma.site.update({
      where: { id: siteId },
      data: {
        securityConcept: securityConceptData,
      },
      select: {
        id: true,
        name: true,
        securityConcept: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Sicherheitskonzept erfolgreich erstellt',
      data: {
        siteId: updatedSite.id,
        siteName: updatedSite.name,
        ...updatedSite.securityConcept as object,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/sites/:siteId/security-concept/:id - Sicherheitskonzept aktualisieren
export const updateSecurityConcept = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.params;
    const updateData = req.body;

    // Prüfe ob Site existiert
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { id: true, securityConcept: true },
    });

    if (!site) {
      res.status(404).json({ success: false, message: 'Objekt nicht gefunden' });
      return;
    }

    // Merge existierendes Konzept mit Updates
    const existingConcept = (site.securityConcept as object) || {};
    const mergedConcept = {
      ...existingConcept,
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    const updatedSite = await prisma.site.update({
      where: { id: siteId },
      data: {
        securityConcept: mergedConcept,
      },
      select: {
        id: true,
        name: true,
        securityConcept: true,
      },
    });

    res.json({
      success: true,
      message: 'Sicherheitskonzept aktualisiert',
      data: {
        siteId: updatedSite.id,
        siteName: updatedSite.name,
        ...updatedSite.securityConcept as object,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/sites/:siteId/security-concept/:id/approve - Sicherheitskonzept freigeben
export const approveSecurityConcept = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Nicht authentifiziert' });
      return;
    }

    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { id: true, securityConcept: true },
    });

    if (!site) {
      res.status(404).json({ success: false, message: 'Objekt nicht gefunden' });
      return;
    }

    if (!site.securityConcept) {
      res.status(404).json({ success: false, message: 'Kein Sicherheitskonzept vorhanden' });
      return;
    }

    // Füge Freigabe-Informationen hinzu
    const existingConcept = site.securityConcept as Record<string, unknown>;
    const approvedConcept = {
      ...existingConcept,
      status: 'APPROVED',
      approvedBy: userId,
      approvedAt: new Date().toISOString(),
    };

    const updatedSite = await prisma.site.update({
      where: { id: siteId },
      data: {
        securityConcept: approvedConcept,
      },
      select: {
        id: true,
        name: true,
        securityConcept: true,
      },
    });

    res.json({
      success: true,
      message: 'Sicherheitskonzept wurde freigegeben',
      data: {
        siteId: updatedSite.id,
        siteName: updatedSite.name,
        ...updatedSite.securityConcept as object,
      },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/sites/:siteId/security-concept/:id - Sicherheitskonzept löschen
export const deleteSecurityConcept = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.params;

    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { id: true, securityConcept: true },
    });

    if (!site) {
      res.status(404).json({ success: false, message: 'Objekt nicht gefunden' });
      return;
    }

    if (!site.securityConcept) {
      res.status(404).json({ success: false, message: 'Kein Sicherheitskonzept vorhanden' });
      return;
    }

    // Lösche Sicherheitskonzept (setze auf DbNull)
    await prisma.site.update({
      where: { id: siteId },
      data: {
        securityConcept: Prisma.DbNull,
      },
    });

    res.json({
      success: true,
      message: 'Sicherheitskonzept gelöscht',
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/sites/:siteId/security-concept/:id/shift-model - ShiftModel Auto-Sync Update
export const updateShiftModel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.params;
    const { shiftModel } = req.body;

    if (!shiftModel) {
      res.status(400).json({ success: false, message: 'ShiftModel fehlt' });
      return;
    }

    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { id: true, securityConcept: true },
    });

    if (!site) {
      res.status(404).json({ success: false, message: 'Objekt nicht gefunden' });
      return;
    }

    // Update nur ShiftModel im Konzept
    const existingConcept = (site.securityConcept as Record<string, unknown>) || {};
    const updatedConcept = {
      ...existingConcept,
      shiftModel,
      updatedAt: new Date().toISOString(),
    };

    const updatedSite = await prisma.site.update({
      where: { id: siteId },
      data: {
        securityConcept: updatedConcept,
      },
      select: {
        id: true,
        name: true,
        securityConcept: true,
      },
    });

    res.json({
      success: true,
      message: 'ShiftModel automatisch synchronisiert',
      data: updatedSite.securityConcept,
    });
  } catch (error) {
    console.error('ShiftModel Auto-Sync Error:', error);
    next(error);
  }
};

// POST /api/sites/:siteId/security-concept/:id/upload-attachment - Anhang hochladen
export const uploadAttachment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.params;

    // Prüfe ob Site existiert
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { id: true, securityConcept: true },
    });

    if (!site) {
      res.status(404).json({ success: false, message: 'Objekt nicht gefunden' });
      return;
    }

    // Prüfe ob Datei hochgeladen wurde
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Keine Datei hochgeladen' });
      return;
    }

    // Erstelle URL für Frontend
    const fileUrl = `/uploads/security-concept-attachments/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Anhang erfolgreich hochgeladen',
      data: {
        filename: req.file.originalname,
        fileUrl,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
    });
  } catch (error) {
    next(error);
  }
};
