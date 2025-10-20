import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import crypto from 'crypto';

/**
 * GET /api/sites/:siteId/control-points
 * Liste aller Kontrollpunkte für ein Objekt
 */
export const getControlPoints = async (req: Request, res: Response, next: NextFunction)=> {
  try {
    const { siteId } = req.params;
    const { activeOnly } = req.query;

    const where: any = { siteId };
    if (activeOnly === 'true') {
      where.isActive = true;
    }

    const points = await prisma.controlPoint.findMany({
      where,
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { scans: true },
        },
      },
    });

    logger.info(`Fetched ${points.length} control points for site ${siteId}`);

    res.json({
      success: true,
      data: points,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/sites/:siteId/control-points/:id
 * Details eines Kontrollpunktes
 */
export const getControlPointById = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;

    const point = await prisma.controlPoint.findUnique({
      where: { id },
      include: {
        site: {
          select: { id: true, name: true },
        },
        scans: {
          take: 10,
          orderBy: { scannedAt: 'desc' },
          include: {
            scanner: {
              select: { id: true, firstName: true, lastName: true },
            },
            round: {
              select: { id: true, status: true },
            },
          },
        },
        _count: {
          select: { scans: true },
        },
      },
    });

    if (!point) {
      return res.status(404).json({
        success: false,
        message: 'Kontrollpunkt nicht gefunden',
      });
    }

    logger.info(`Fetched control point details: ${id}`);

    res.json({
      success: true,
      data: point,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/sites/:siteId/control-points
 * Neuen Kontrollpunkt anlegen
 */
export const createControlPoint = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { siteId } = req.params;
    const { name, location, instructions, nfcTagId, qrCode, order, latitude, longitude } = req.body;

    // Validierung
    if (!name || !location) {
      return res.status(400).json({
        success: false,
        message: 'Pflichtfelder fehlen: name, location',
      });
    }

    // Mindestens NFC oder QR muss gesetzt sein
    if (!nfcTagId && !qrCode) {
      return res.status(400).json({
        success: false,
        message: 'Mindestens NFC-Tag-ID oder QR-Code muss angegeben werden',
      });
    }

    // Site existiert?
    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Objekt nicht gefunden',
      });
    }

    const point = await prisma.controlPoint.create({
      data: {
        siteId,
        name,
        location,
        instructions: instructions || null,
        nfcTagId: nfcTagId || null,
        qrCode: qrCode || null,
        order: order || 0,
        latitude: latitude || null,
        longitude: longitude || null,
      },
    });

    logger.info(`Created control point: ${point.id} for site ${siteId}`);

    res.status(201).json({
      success: true,
      message: 'Kontrollpunkt erfolgreich angelegt',
      data: point,
    });
  } catch (error: any) {
    // Unique Constraint Violation
    if (error.code === 'P2002') {
      const field = error.meta?.target?.includes('nfcTagId') ? 'NFC-Tag-ID' : 'QR-Code';
      return res.status(400).json({
        success: false,
        message: `${field} wird bereits verwendet`,
      });
    }
    next(error);
  }
};

/**
 * PUT /api/sites/:siteId/control-points/:id
 * Kontrollpunkt bearbeiten
 */
export const updateControlPoint = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const { name, location, instructions, nfcTagId, qrCode, order, latitude, longitude, isActive } = req.body;

    const point = await prisma.controlPoint.findUnique({ where: { id } });
    if (!point) {
      return res.status(404).json({
        success: false,
        message: 'Kontrollpunkt nicht gefunden',
      });
    }

    const updated = await prisma.controlPoint.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(location !== undefined && { location }),
        ...(instructions !== undefined && { instructions }),
        ...(nfcTagId !== undefined && { nfcTagId }),
        ...(qrCode !== undefined && { qrCode }),
        ...(order !== undefined && { order }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    logger.info(`Updated control point: ${id}`);

    res.json({
      success: true,
      message: 'Kontrollpunkt erfolgreich aktualisiert',
      data: updated,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      const field = error.meta?.target?.includes('nfcTagId') ? 'NFC-Tag-ID' : 'QR-Code';
      return res.status(400).json({
        success: false,
        message: `${field} wird bereits verwendet`,
      });
    }
    next(error);
  }
};

/**
 * DELETE /api/sites/:siteId/control-points/:id
 * Kontrollpunkt löschen (soft delete via isActive = false)
 */
export const deleteControlPoint = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;

    const point = await prisma.controlPoint.findUnique({ where: { id } });
    if (!point) {
      return res.status(404).json({
        success: false,
        message: 'Kontrollpunkt nicht gefunden',
      });
    }

    // Soft delete: isActive = false
    await prisma.controlPoint.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info(`Deleted (soft) control point: ${id}`);

    res.json({
      success: true,
      message: 'Kontrollpunkt erfolgreich gelöscht',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/sites/:siteId/control-points/:id/generate-qr
 * QR-Code generieren (falls noch nicht vorhanden)
 */
export const generateQRCode = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { siteId, id } = req.params;

    const point = await prisma.controlPoint.findUnique({ where: { id } });
    if (!point) {
      return res.status(404).json({
        success: false,
        message: 'Kontrollpunkt nicht gefunden',
      });
    }

    if (point.qrCode) {
      return res.status(400).json({
        success: false,
        message: 'Kontrollpunkt hat bereits einen QR-Code',
      });
    }

    // QR-Code generieren: CP-{siteId}-{pointId}-{secret}
    const secret = crypto.randomBytes(4).toString('hex'); // 8-stelliger Hex
    const qrCode = `CP-${siteId}-${id}-${secret}`;

    const updated = await prisma.controlPoint.update({
      where: { id },
      data: { qrCode },
    });

    logger.info(`Generated QR code for control point: ${id}`);

    res.json({
      success: true,
      message: 'QR-Code erfolgreich generiert',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/control-points/:id/history
 * Scan-Historie eines Kontrollpunktes
 */
export const getControlPointHistory = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const point = await prisma.controlPoint.findUnique({ where: { id } });
    if (!point) {
      return res.status(404).json({
        success: false,
        message: 'Kontrollpunkt nicht gefunden',
      });
    }

    const scans = await prisma.controlScan.findMany({
      where: { pointId: id },
      orderBy: { scannedAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
      include: {
        scanner: {
          select: { id: true, firstName: true, lastName: true },
        },
        round: {
          select: { id: true, status: true, startedAt: true, completedAt: true },
        },
      },
    });

    const total = await prisma.controlScan.count({
      where: { pointId: id },
    });

    logger.info(`Fetched ${scans.length} scans for control point ${id}`);

    res.json({
      success: true,
      data: scans,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error) {
    next(error);
  }
};
