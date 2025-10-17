import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

// GET /api/clearances - Alle Clearances mit Filterung
export const getAllClearances = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, siteId, status } = req.query;

    const where: any = {};
    if (userId && typeof userId === 'string') where.userId = userId;
    if (siteId && typeof siteId === 'string') where.siteId = siteId;
    if (status && typeof status === 'string') where.status = status;

    const clearances = await prisma.objectClearance.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        site: { select: { id: true, name: true, address: true, city: true } },
        trainer: { select: { id: true, firstName: true, lastName: true } },
        approver: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: clearances });
  } catch (error) {
    next(error);
  }
};

// POST /api/clearances - Neue Clearance erstellen
export const createClearance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, siteId, trainedBy, notes, validUntil, status } = req.body;

    const clearance = await prisma.objectClearance.create({
      data: {
        userId,
        siteId,
        trainedBy,
        notes,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        status: status || 'TRAINING', // Default: TRAINING
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        site: { select: { id: true, name: true } },
        trainer: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    res.status(201).json({ success: true, message: 'Clearance erfolgreich erstellt', data: clearance });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      res.status(409).json({ success: false, message: 'Clearance existiert bereits für diesen Mitarbeiter und Objekt' });
      return;
    }
    next(error);
  }
};

// GET /api/clearances/:id - Einzelne Clearance
export const getClearanceById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const clearance = await prisma.objectClearance.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        site: { select: { id: true, name: true, address: true, city: true } },
        trainer: { select: { id: true, firstName: true, lastName: true } },
        approver: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!clearance) {
      res.status(404).json({ success: false, message: 'Clearance nicht gefunden' });
      return;
    }

    res.json({ success: true, data: clearance });
  } catch (error) {
    next(error);
  }
};

// PUT /api/clearances/:id - Clearance aktualisieren
export const updateClearance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, notes, validUntil, trainingCompletedAt, trainingHours, approvedBy } = req.body;

    const updated = await prisma.objectClearance.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(validUntil !== undefined && { validUntil: validUntil ? new Date(validUntil) : null }),
        ...(trainingCompletedAt !== undefined && {
          trainingCompletedAt: trainingCompletedAt ? new Date(trainingCompletedAt) : null,
        }),
        ...(trainingHours !== undefined && { trainingHours }),
        ...(approvedBy !== undefined && { approvedBy }),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        site: { select: { id: true, name: true } },
        trainer: { select: { id: true, firstName: true, lastName: true } },
        approver: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    res.json({ success: true, message: 'Clearance aktualisiert', data: updated });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Clearance nicht gefunden' });
      return;
    }
    next(error);
  }
};

// DELETE /api/clearances/:id - Clearance löschen
export const deleteClearance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.objectClearance.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Clearance nicht gefunden' });
      return;
    }
    next(error);
  }
};

// POST /api/clearances/:id/complete-training - Training abschließen
export const completeTraining = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { trainingHours, approvedBy } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Nicht authentifiziert' });
      return;
    }

    const updated = await prisma.objectClearance.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        trainingCompletedAt: new Date(),
        trainingHours: trainingHours || 0,
        approvedBy: approvedBy || userId,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        site: { select: { id: true, name: true } },
      },
    });

    res.json({ success: true, message: 'Training erfolgreich abgeschlossen', data: updated });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Clearance nicht gefunden' });
      return;
    }
    next(error);
  }
};

// POST /api/clearances/:id/revoke - Clearance widerrufen
export const revokeClearance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const updated = await prisma.objectClearance.update({
      where: { id },
      data: {
        status: 'REVOKED',
        notes: notes || 'Clearance wurde widerrufen',
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        site: { select: { id: true, name: true } },
      },
    });

    res.json({ success: true, message: 'Clearance widerrufen', data: updated });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Clearance nicht gefunden' });
      return;
    }
    next(error);
  }
};
