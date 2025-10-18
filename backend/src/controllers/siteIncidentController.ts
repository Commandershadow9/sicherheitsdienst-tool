import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

// GET /api/sites/:siteId/incidents - Alle Incidents eines Objekts
export const getSiteIncidents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.params;
    const category = req.query.category as any;
    const status = req.query.status as any;
    const severity = req.query.severity as any;

    const incidents = await prisma.siteIncident.findMany({
      where: {
        siteId,
        ...(category && { category }),
        ...(status && { status }),
        ...(severity && { severity }),
      },
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true } },
        site: { select: { id: true, name: true } },
      },
      orderBy: { occurredAt: 'desc' },
    });

    res.json({ success: true, data: incidents });
  } catch (error) {
    next(error);
  }
};

// GET /api/sites/:siteId/incidents/:id - Ein spezifischer Incident
export const getIncidentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const incident = await prisma.siteIncident.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
        site: { select: { id: true, name: true, address: true } },
      },
    });

    if (!incident) {
      res.status(404).json({ success: false, message: 'Vorfall nicht gefunden' });
      return;
    }

    res.json({ success: true, data: incident });
  } catch (error) {
    next(error);
  }
};

// POST /api/sites/:siteId/incidents - Incident erstellen
export const createIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.params;
    const { title, description, category, severity, occurredAt, location, involvedPersons } = req.body;
    const reportedBy = req.user?.id;

    if (!reportedBy) {
      res.status(401).json({ success: false, message: 'Nicht authentifiziert' });
      return;
    }

    // Validierung
    if (!title || !category || !severity || !occurredAt) {
      res.status(400).json({ success: false, message: 'Pflichtfelder fehlen: title, category, severity, occurredAt' });
      return;
    }

    const incident = await prisma.siteIncident.create({
      data: {
        siteId,
        title,
        description,
        category,
        severity,
        occurredAt: new Date(occurredAt),
        location,
        involvedPersons,
        reportedBy,
      },
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true } },
        site: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ success: true, message: 'Vorfall erfolgreich gemeldet', data: incident });
  } catch (error) {
    next(error);
  }
};

// PUT /api/sites/:siteId/incidents/:id - Incident aktualisieren
export const updateIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, description, category, severity, occurredAt, location, involvedPersons, status } = req.body;

    const incident = await prisma.siteIncident.findUnique({ where: { id } });
    if (!incident) {
      res.status(404).json({ success: false, message: 'Vorfall nicht gefunden' });
      return;
    }

    const updated = await prisma.siteIncident.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(severity && { severity }),
        ...(occurredAt && { occurredAt: new Date(occurredAt) }),
        ...(location !== undefined && { location }),
        ...(involvedPersons !== undefined && { involvedPersons }),
        ...(status && { status }),
      },
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true } },
        site: { select: { id: true, name: true } },
      },
    });

    res.json({ success: true, message: 'Vorfall erfolgreich aktualisiert', data: updated });
  } catch (error) {
    next(error);
  }
};

// PUT /api/sites/:siteId/incidents/:id/resolve - Incident auflösen
export const resolveIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;

    const incident = await prisma.siteIncident.findUnique({ where: { id } });
    if (!incident) {
      res.status(404).json({ success: false, message: 'Vorfall nicht gefunden' });
      return;
    }

    if (incident.status === 'RESOLVED' || incident.status === 'CLOSED') {
      res.status(400).json({ success: false, message: 'Vorfall ist bereits aufgelöst' });
      return;
    }

    const updated = await prisma.siteIncident.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolution,
      },
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true } },
        site: { select: { id: true, name: true } },
      },
    });

    res.json({ success: true, message: 'Vorfall erfolgreich aufgelöst', data: updated });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/sites/:siteId/incidents/:id - Incident löschen
export const deleteIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const incident = await prisma.siteIncident.findUnique({ where: { id } });
    if (!incident) {
      res.status(404).json({ success: false, message: 'Vorfall nicht gefunden' });
      return;
    }

    await prisma.siteIncident.delete({ where: { id } });

    res.json({ success: true, message: 'Vorfall erfolgreich gelöscht' });
  } catch (error) {
    next(error);
  }
};
