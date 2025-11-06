import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import logger from '../utils/logger';

/**
 * POST /api/sites/:siteId/calculations/:id/send
 * Kalkulation versenden (Status → SENT)
 */
export const sendSiteCalculation = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;

    const calculation = await prisma.siteCalculation.findUnique({ where: { id } });
    if (!calculation) {
      return res.status(404).json({
        success: false,
        message: 'Kalkulation nicht gefunden',
      });
    }

    if (calculation.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Nur Entwürfe können versendet werden',
      });
    }

    const updated = await prisma.siteCalculation.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    logger.info(`Sent calculation: ${id}`);

    res.json({
      success: true,
      message: 'Kalkulation erfolgreich versendet',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/sites/:siteId/calculations/:id/accept
 * Kalkulation annehmen (Status → ACCEPTED)
 */
export const acceptSiteCalculation = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;

    const calculation = await prisma.siteCalculation.findUnique({ where: { id } });
    if (!calculation) {
      return res.status(404).json({
        success: false,
        message: 'Kalkulation nicht gefunden',
      });
    }

    if (calculation.status !== 'SENT') {
      return res.status(400).json({
        success: false,
        message: 'Nur versendete Kalkulationen können angenommen werden',
      });
    }

    const updated = await prisma.siteCalculation.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });

    logger.info(`Accepted calculation: ${id}`);

    res.json({
      success: true,
      message: 'Kalkulation erfolgreich angenommen',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/sites/:siteId/calculations/:id/reject
 * Kalkulation ablehnen (Status → REJECTED)
 */
export const rejectSiteCalculation = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const calculation = await prisma.siteCalculation.findUnique({ where: { id } });
    if (!calculation) {
      return res.status(404).json({
        success: false,
        message: 'Kalkulation nicht gefunden',
      });
    }

    if (calculation.status !== 'SENT') {
      return res.status(400).json({
        success: false,
        message: 'Nur versendete Kalkulationen können abgelehnt werden',
      });
    }

    const updated = await prisma.siteCalculation.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        notes: notes || calculation.notes,
      },
    });

    logger.info(`Rejected calculation: ${id}`);

    res.json({
      success: true,
      message: 'Kalkulation erfolgreich abgelehnt',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/sites/:siteId/calculations/:id/archive
 * Archiviert eine Kalkulation (beliebiger Status → ARCHIVED)
 */
export const archiveSiteCalculation = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;

    const calculation = await prisma.siteCalculation.findUnique({ where: { id } });
    if (!calculation) {
      return res.status(404).json({
        success: false,
        message: 'Kalkulation nicht gefunden',
      });
    }

    if (calculation.status === 'ARCHIVED') {
      return res.status(400).json({
        success: false,
        message: 'Kalkulation ist bereits archiviert',
      });
    }

    const updated = await prisma.siteCalculation.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
      },
    });

    logger.info(`Archived calculation: ${id}`);

    res.json({
      success: true,
      message: 'Kalkulation erfolgreich archiviert',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
