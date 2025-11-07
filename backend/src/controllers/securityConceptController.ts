import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

// GET /api/sites/:siteId/security-concept - Aktives/neuestes Sicherheitskonzept abrufen
export const getSecurityConcept = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.params;
    const { status } = req.query;

    // Prüfe ob Site existiert
    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      res.status(404).json({ success: false, message: 'Objekt nicht gefunden' });
      return;
    }

    // Filter nach Status, falls angegeben
    const where: any = { siteId };
    if (status && typeof status === 'string') {
      where.status = status;
    }

    // Hole neuestes Konzept (nach createdAt sortiert)
    const concept = await prisma.securityConcept.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            postalCode: true,
            status: true,
          },
        },
      },
    });

    if (!concept) {
      res.status(404).json({ success: false, message: 'Kein Sicherheitskonzept gefunden' });
      return;
    }

    res.json({ success: true, data: concept });
  } catch (error) {
    next(error);
  }
};

// GET /api/sites/:siteId/security-concepts - Alle Sicherheitskonzepte für ein Objekt (Historie)
export const getAllSecurityConcepts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.params;

    const concepts = await prisma.securityConcept.findMany({
      where: { siteId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        version: true,
        status: true,
        validFrom: true,
        validUntil: true,
        approvedBy: true,
        approvedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ success: true, data: concepts, count: concepts.length });
  } catch (error) {
    next(error);
  }
};

// GET /api/sites/:siteId/security-concept/:id - Einzelnes Sicherheitskonzept mit allen Details
export const getSecurityConceptById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId, id } = req.params;

    const concept = await prisma.securityConcept.findFirst({
      where: { id, siteId },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            postalCode: true,
          },
        },
      },
    });

    if (!concept) {
      res.status(404).json({ success: false, message: 'Sicherheitskonzept nicht gefunden' });
      return;
    }

    res.json({ success: true, data: concept });
  } catch (error) {
    next(error);
  }
};

// POST /api/sites/:siteId/security-concept - Neues Sicherheitskonzept erstellen
export const createSecurityConcept = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.params;
    const {
      version,
      status,
      validFrom,
      validUntil,
      contractScope,
      legalBasis,
      siteSituation,
      riskAssessment,
      protectionMeasures,
      staffRequirements,
      shiftModel,
      taskProfiles,
      communicationPlan,
      emergencyPlan,
      dataProtection,
      occupationalSafety,
      qualityMetrics,
      handoverProcedures,
      attachments,
      trafficConcept,
      weaponConcept,
      weatherProtocols,
      notes,
    } = req.body;

    // Prüfe ob Site existiert
    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      res.status(404).json({ success: false, message: 'Objekt nicht gefunden' });
      return;
    }

    const concept = await prisma.securityConcept.create({
      data: {
        siteId,
        version: version || '1.0',
        status: status || 'DRAFT',
        validFrom: validFrom ? new Date(validFrom) : undefined,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        contractScope,
        legalBasis,
        siteSituation,
        riskAssessment,
        protectionMeasures,
        staffRequirements,
        shiftModel,
        taskProfiles,
        communicationPlan,
        emergencyPlan,
        dataProtection,
        occupationalSafety,
        qualityMetrics,
        handoverProcedures,
        attachments,
        trafficConcept,
        weaponConcept,
        weatherProtocols,
        notes,
      },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Sicherheitskonzept erfolgreich erstellt',
      data: concept,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/sites/:siteId/security-concept/:id - Sicherheitskonzept aktualisieren
export const updateSecurityConcept = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId, id } = req.params;
    const updateData = req.body;

    // Prüfe ob Konzept existiert
    const existing = await prisma.securityConcept.findFirst({
      where: { id, siteId },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Sicherheitskonzept nicht gefunden' });
      return;
    }

    // Verhindere Aktualisierung von freigegebenen/aktiven Konzepten (außer für ADMIN/MANAGER)
    const userRole = req.user?.role;
    const canManageActiveConcepts = userRole === 'ADMIN' || userRole === 'MANAGER';

    if ((existing.status === 'ACTIVE' || existing.status === 'APPROVED') && !canManageActiveConcepts) {
      res.status(400).json({
        success: false,
        message: 'Freigegebene oder aktive Konzepte können nicht bearbeitet werden. Erstellen Sie eine neue Version.',
      });
      return;
    }

    // Update History: Füge Eintrag zur Revisions-Historie hinzu
    const currentHistory = Array.isArray(existing.revisionHistory) ? existing.revisionHistory : [];
    const newHistoryEntry = {
      version: existing.version,
      date: new Date().toISOString(),
      changes: 'Konzept aktualisiert',
      editor: req.user?.id || 'system',
    };

    const concept = await prisma.securityConcept.update({
      where: { id },
      data: {
        ...updateData,
        validFrom: updateData.validFrom ? new Date(updateData.validFrom) : undefined,
        validUntil: updateData.validUntil ? new Date(updateData.validUntil) : undefined,
        revisionHistory: [...currentHistory, newHistoryEntry],
        updatedAt: new Date(),
      },
      include: {
        site: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Sicherheitskonzept aktualisiert',
      data: concept,
    });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Sicherheitskonzept nicht gefunden' });
      return;
    }
    next(error);
  }
};

// POST /api/sites/:siteId/security-concept/:id/approve - Sicherheitskonzept freigeben
export const approveSecurityConcept = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId, id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Nicht authentifiziert' });
      return;
    }

    const concept = await prisma.securityConcept.findFirst({
      where: { id, siteId },
    });

    if (!concept) {
      res.status(404).json({ success: false, message: 'Sicherheitskonzept nicht gefunden' });
      return;
    }

    if (concept.status === 'APPROVED' || concept.status === 'ACTIVE') {
      res.status(400).json({ success: false, message: 'Konzept ist bereits freigegeben' });
      return;
    }

    // Deaktiviere alle anderen aktiven Konzepte für dieses Objekt
    await prisma.securityConcept.updateMany({
      where: {
        siteId,
        status: 'ACTIVE',
      },
      data: {
        status: 'ARCHIVED',
      },
    });

    const updated = await prisma.securityConcept.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        approvedBy: userId,
        approvedAt: new Date(),
      },
      include: {
        site: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Sicherheitskonzept wurde freigegeben und ist nun aktiv',
      data: updated,
    });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Sicherheitskonzept nicht gefunden' });
      return;
    }
    next(error);
  }
};

// DELETE /api/sites/:siteId/security-concept/:id - Sicherheitskonzept löschen
export const deleteSecurityConcept = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId, id } = req.params;

    const concept = await prisma.securityConcept.findFirst({
      where: { id, siteId },
    });

    if (!concept) {
      res.status(404).json({ success: false, message: 'Sicherheitskonzept nicht gefunden' });
      return;
    }

    // Verhindere Löschen von aktiven Konzepten
    if (concept.status === 'ACTIVE') {
      res.status(400).json({
        success: false,
        message: 'Aktive Konzepte können nicht gelöscht werden. Bitte zuerst deaktivieren.',
      });
      return;
    }

    await prisma.securityConcept.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Sicherheitskonzept gelöscht',
    });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Sicherheitskonzept nicht gefunden' });
      return;
    }
    next(error);
  }
};

// POST /api/sites/:siteId/security-concept/:id/upload-attachment - Anhang hochladen
export const uploadAttachment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId, id } = req.params;

    // Prüfe ob Konzept existiert
    const concept = await prisma.securityConcept.findFirst({
      where: { id, siteId },
    });

    if (!concept) {
      res.status(404).json({ success: false, message: 'Sicherheitskonzept nicht gefunden' });
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
