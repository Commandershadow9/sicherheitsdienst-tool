import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import logger from '../utils/logger';

/**
 * GET /api/price-models
 * Liste aller Preismodelle
 */
export const getPriceModels = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { activeOnly } = req.query;

    const where: any = {};
    if (activeOnly === 'true') {
      where.isActive = true;
    }

    const models = await prisma.priceModel.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { calculations: true },
        },
      },
    });

    logger.info(`Fetched ${models.length} price models`);

    res.json({
      success: true,
      data: models,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/price-models/:id
 * Details eines Preismodells
 */
export const getPriceModelById = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;

    const model = await prisma.priceModel.findUnique({
      where: { id },
      include: {
        _count: {
          select: { calculations: true },
        },
      },
    });

    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'Preismodell nicht gefunden',
      });
    }

    logger.info(`Fetched price model: ${id}`);

    res.json({
      success: true,
      data: model,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/price-models
 * Neues Preismodell anlegen
 */
export const createPriceModel = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const {
      name,
      description,
      isActive,
      hourlyRateEmployee,
      hourlyRateShiftLeader,
      hourlyRateSiteManager,
      nightSurcharge,
      saturdaySurcharge,
      sundaySurcharge,
      holidaySurcharge,
      nslCertificateSurcharge,
      dogHandlerSurcharge,
      weaponLicenseSurcharge,
      overheadPercentage,
      profitMarginPercentage,
    } = req.body;

    // Validierung
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name ist erforderlich',
      });
    }

    const model = await prisma.priceModel.create({
      data: {
        name,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
        hourlyRateEmployee: hourlyRateEmployee || 13.5,
        hourlyRateShiftLeader: hourlyRateShiftLeader || 16.0,
        hourlyRateSiteManager: hourlyRateSiteManager || 18.5,
        nightSurcharge: nightSurcharge || 25,
        saturdaySurcharge: saturdaySurcharge || 25,
        sundaySurcharge: sundaySurcharge || 50,
        holidaySurcharge: holidaySurcharge || 100,
        nslCertificateSurcharge: nslCertificateSurcharge || 1.5,
        dogHandlerSurcharge: dogHandlerSurcharge || 2.5,
        weaponLicenseSurcharge: weaponLicenseSurcharge || 2.0,
        overheadPercentage: overheadPercentage || 12,
        profitMarginPercentage: profitMarginPercentage || 15,
      },
    });

    logger.info(`Created price model: ${model.id}`);

    res.status(201).json({
      success: true,
      message: 'Preismodell erfolgreich angelegt',
      data: model,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/price-models/:id
 * Preismodell bearbeiten
 */
export const updatePriceModel = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      isActive,
      hourlyRateEmployee,
      hourlyRateShiftLeader,
      hourlyRateSiteManager,
      nightSurcharge,
      saturdaySurcharge,
      sundaySurcharge,
      holidaySurcharge,
      nslCertificateSurcharge,
      dogHandlerSurcharge,
      weaponLicenseSurcharge,
      overheadPercentage,
      profitMarginPercentage,
    } = req.body;

    const model = await prisma.priceModel.findUnique({ where: { id } });
    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'Preismodell nicht gefunden',
      });
    }

    const updated = await prisma.priceModel.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(hourlyRateEmployee !== undefined && { hourlyRateEmployee }),
        ...(hourlyRateShiftLeader !== undefined && { hourlyRateShiftLeader }),
        ...(hourlyRateSiteManager !== undefined && { hourlyRateSiteManager }),
        ...(nightSurcharge !== undefined && { nightSurcharge }),
        ...(saturdaySurcharge !== undefined && { saturdaySurcharge }),
        ...(sundaySurcharge !== undefined && { sundaySurcharge }),
        ...(holidaySurcharge !== undefined && { holidaySurcharge }),
        ...(nslCertificateSurcharge !== undefined && { nslCertificateSurcharge }),
        ...(dogHandlerSurcharge !== undefined && { dogHandlerSurcharge }),
        ...(weaponLicenseSurcharge !== undefined && { weaponLicenseSurcharge }),
        ...(overheadPercentage !== undefined && { overheadPercentage }),
        ...(profitMarginPercentage !== undefined && { profitMarginPercentage }),
      },
    });

    logger.info(`Updated price model: ${id}`);

    res.json({
      success: true,
      message: 'Preismodell erfolgreich aktualisiert',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/price-models/:id
 * Preismodell löschen (soft delete via isActive = false)
 */
export const deletePriceModel = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;

    const model = await prisma.priceModel.findUnique({
      where: { id },
      include: {
        _count: {
          select: { calculations: true },
        },
      },
    });

    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'Preismodell nicht gefunden',
      });
    }

    // Check if model is used in calculations
    if (model._count.calculations > 0) {
      // Soft delete
      await prisma.priceModel.update({
        where: { id },
        data: { isActive: false },
      });

      logger.info(`Soft deleted price model: ${id} (${model._count.calculations} calculations)`);

      return res.json({
        success: true,
        message: `Preismodell deaktiviert (wird von ${model._count.calculations} Kalkulationen verwendet)`,
      });
    }

    // Hard delete if not used
    await prisma.priceModel.delete({ where: { id } });

    logger.info(`Deleted price model: ${id}`);

    res.json({
      success: true,
      message: 'Preismodell erfolgreich gelöscht',
    });
  } catch (error) {
    next(error);
  }
};
