import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import logger from '../utils/logger';

/**
 * GET /api/sites/:siteId/control-rounds
 * Liste aller Kontrollgänge für ein Objekt
 */
export const getControlRounds = async (req: Request, res: Response, next: NextFunction)=> {
  try {
    const { siteId } = req.params;
    const { status, performedBy, limit = 50, offset = 0 } = req.query;

    const where: any = { siteId };
    if (status) {
      where.status = status;
    }
    if (performedBy) {
      where.performedBy = performedBy;
    }

    const rounds = await prisma.controlRound.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
      include: {
        performer: {
          select: { id: true, firstName: true, lastName: true },
        },
        shift: {
          select: { id: true, title: true, startTime: true, endTime: true },
        },
        _count: {
          select: { scans: true },
        },
      },
    });

    const total = await prisma.controlRound.count({ where });

    logger.info(`Fetched ${rounds.length} control rounds for site ${siteId}`);

    res.json({
      success: true,
      data: rounds,
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

/**
 * GET /api/control-rounds/:id
 * Details eines Kontrollgangs
 */
export const getControlRoundById = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;

    const round = await prisma.controlRound.findUnique({
      where: { id },
      include: {
        site: {
          select: { id: true, name: true },
        },
        performer: {
          select: { id: true, firstName: true, lastName: true, employeeId: true },
        },
        shift: {
          select: { id: true, title: true, startTime: true, endTime: true },
        },
        scans: {
          orderBy: { scannedAt: 'asc' },
          include: {
            point: {
              select: { id: true, name: true, location: true, order: true },
            },
            scanner: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!round) {
      return res.status(404).json({
        success: false,
        message: 'Kontrollgang nicht gefunden',
      });
    }

    logger.info(`Fetched control round details: ${id}`);

    res.json({
      success: true,
      data: round,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/sites/:siteId/control-rounds
 * Kontrollgang starten
 */
export const startControlRound = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { siteId } = req.params;
    const { shiftId, notes } = req.body;
    const userId = req.user!.id; // Aus authenticate Middleware

    // Site existiert?
    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Objekt nicht gefunden',
      });
    }

    // Anzahl aktiver Kontrollpunkte ermitteln
    const totalPoints = await prisma.controlPoint.count({
      where: { siteId, isActive: true },
    });

    if (totalPoints === 0) {
      return res.status(400).json({
        success: false,
        message: 'Es gibt keine aktiven Kontrollpunkte für dieses Objekt',
      });
    }

    // Kontrollgang erstellen
    const round = await prisma.controlRound.create({
      data: {
        siteId,
        shiftId: shiftId || null,
        performedBy: userId,
        totalPoints,
        notes: notes || null,
      },
      include: {
        site: {
          select: { id: true, name: true },
        },
        performer: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    logger.info(`Started control round: ${round.id} for site ${siteId} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Kontrollgang erfolgreich gestartet',
      data: round,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/control-rounds/:roundId/scans
 * Kontrollpunkt scannen (NFC oder QR)
 */
export const createScan = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { roundId } = req.params;
    const { tagIdentifier, scanMethod, latitude, longitude, accuracy, notes, hasIssue } = req.body;
    const userId = req.user!.id;

    // Validierung
    if (!tagIdentifier || !scanMethod) {
      return res.status(400).json({
        success: false,
        message: 'Pflichtfelder fehlen: tagIdentifier, scanMethod',
      });
    }

    // Round existiert und ist IN_PROGRESS?
    const round = await prisma.controlRound.findUnique({
      where: { id: roundId },
      include: { site: true },
    });

    if (!round) {
      return res.status(404).json({
        success: false,
        message: 'Kontrollgang nicht gefunden',
      });
    }

    if (round.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        message: 'Kontrollgang ist nicht aktiv',
      });
    }

    // Kontrollpunkt finden (via NFC-Tag-ID oder QR-Code)
    let point;
    if (scanMethod === 'NFC') {
      point = await prisma.controlPoint.findFirst({
        where: { nfcTagId: tagIdentifier, siteId: round.siteId, isActive: true },
      });
    } else if (scanMethod === 'QR_CODE') {
      point = await prisma.controlPoint.findFirst({
        where: { qrCode: tagIdentifier, siteId: round.siteId, isActive: true },
      });
    }

    if (!point) {
      // Scan als ungültig markieren
      const invalidScan = await prisma.controlScan.create({
        data: {
          roundId,
          pointId: '', // Kein Point gefunden
          scannedBy: userId,
          scanMethod,
          tagIdentifier,
          latitude: latitude || null,
          longitude: longitude || null,
          accuracy: accuracy || null,
          notes: notes || null,
          hasIssue: hasIssue || false,
          isValid: false,
          validationError: 'Kontrollpunkt nicht gefunden oder nicht aktiv',
        },
      });

      logger.warn(`Invalid scan: tag ${tagIdentifier} not found for round ${roundId}`);

      return res.status(400).json({
        success: false,
        message: 'Kontrollpunkt nicht gefunden oder nicht aktiv',
        data: invalidScan,
      });
    }

    // GPS-Verifikation (optional)
    let gpsValid = true;
    if (latitude && longitude && point.latitude && point.longitude) {
      const distance = calculateDistance(latitude, longitude, point.latitude, point.longitude);
      if (distance > 100) {
        // Max. 100 Meter Toleranz
        gpsValid = false;
        logger.warn(`GPS validation failed: ${distance}m away from point ${point.id}`);
      }
    }

    // Scan erstellen
    const scan = await prisma.controlScan.create({
      data: {
        roundId,
        pointId: point.id,
        scannedBy: userId,
        scanMethod,
        tagIdentifier,
        latitude: latitude || null,
        longitude: longitude || null,
        accuracy: accuracy || null,
        notes: notes || null,
        hasIssue: hasIssue || false,
        isValid: gpsValid,
        validationError: gpsValid ? null : 'GPS-Position weicht zu stark ab',
      },
      include: {
        point: {
          select: { id: true, name: true, location: true, order: true },
        },
      },
    });

    // Statistiken aktualisieren
    await prisma.controlRound.update({
      where: { id: roundId },
      data: {
        scannedPoints: { increment: 1 },
      },
    });

    logger.info(`Scan created: point ${point.id} in round ${roundId}`);

    res.status(201).json({
      success: true,
      message: 'Kontrollpunkt erfolgreich gescannt',
      data: scan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/control-rounds/:roundId/complete
 * Kontrollgang beenden
 */
export const completeControlRound = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { roundId } = req.params;
    const { notes, status = 'COMPLETED' } = req.body;

    const round = await prisma.controlRound.findUnique({
      where: { id: roundId },
    });

    if (!round) {
      return res.status(404).json({
        success: false,
        message: 'Kontrollgang nicht gefunden',
      });
    }

    if (round.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        message: 'Kontrollgang ist nicht aktiv',
      });
    }

    // Anzahl fehlender Punkte berechnen
    const missedPoints = round.totalPoints - round.scannedPoints;

    const updated = await prisma.controlRound.update({
      where: { id: roundId },
      data: {
        completedAt: new Date(),
        status: status as any,
        missedPoints,
        notes: notes || round.notes,
      },
      include: {
        site: {
          select: { id: true, name: true },
        },
        performer: {
          select: { id: true, firstName: true, lastName: true },
        },
        scans: {
          include: {
            point: {
              select: { id: true, name: true, location: true },
            },
          },
        },
      },
    });

    logger.info(`Completed control round: ${roundId} with status ${status}`);

    res.json({
      success: true,
      message: 'Kontrollgang erfolgreich beendet',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/control-rounds/:roundId/report
 * Protokoll generieren (PDF)
 * TODO: PDF-Generator implementieren (Phase 4d)
 */
export const generateReport = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { roundId } = req.params;

    const round = await prisma.controlRound.findUnique({
      where: { id: roundId },
      include: {
        site: true,
        performer: true,
        scans: {
          include: {
            point: true,
          },
          orderBy: { scannedAt: 'asc' },
        },
      },
    });

    if (!round) {
      return res.status(404).json({
        success: false,
        message: 'Kontrollgang nicht gefunden',
      });
    }

    // TODO: PDF-Generator
    // Für jetzt: JSON-Response
    res.json({
      success: true,
      message: 'PDF-Generator noch nicht implementiert',
      data: round,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/sites/:siteId/control-stats
 * Statistiken für Objekt
 */
export const getControlStats = async (req: Request, res: Response, next: NextFunction)=> {
  try {
    const { siteId } = req.params;
    const { days = 30 } = req.query;

    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - Number(days));

    const [totalPoints, totalRounds, completedRounds, avgScannedPoints] = await Promise.all([
      prisma.controlPoint.count({
        where: { siteId, isActive: true },
      }),
      prisma.controlRound.count({
        where: { siteId, startedAt: { gte: dateThreshold } },
      }),
      prisma.controlRound.count({
        where: { siteId, status: 'COMPLETED', startedAt: { gte: dateThreshold } },
      }),
      prisma.controlRound.aggregate({
        where: { siteId, startedAt: { gte: dateThreshold } },
        _avg: { scannedPoints: true },
      }),
    ]);

    const stats = {
      totalPoints,
      totalRounds,
      completedRounds,
      inProgressRounds: totalRounds - completedRounds,
      avgScannedPoints: avgScannedPoints._avg.scannedPoints || 0,
      completionRate: totalRounds > 0 ? (completedRounds / totalRounds) * 100 : 0,
      period: { days: Number(days), from: dateThreshold, to: new Date() },
    };

    logger.info(`Fetched control stats for site ${siteId}`);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// Helper: Haversine-Formel für Entfernungsberechnung
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Erdradius in Metern
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in Metern
}
