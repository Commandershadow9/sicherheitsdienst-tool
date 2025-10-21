import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import logger from '../utils/logger';

/**
 * GET /api/sites/:siteId/calculations
 * Liste aller Kalkulationen für ein Objekt
 */
export const getSiteCalculations = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { siteId } = req.params;
    const { status } = req.query;

    const where: any = { siteId };
    if (status) {
      where.status = status;
    }

    const calculations = await prisma.siteCalculation.findMany({
      where,
      orderBy: { version: 'desc' },
      include: {
        calculator: {
          select: { id: true, firstName: true, lastName: true },
        },
        priceModel: {
          select: { id: true, name: true },
        },
      },
    });

    logger.info(`Fetched ${calculations.length} calculations for site ${siteId}`);

    res.json({
      success: true,
      data: calculations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/sites/:siteId/calculations/:id
 * Details einer Kalkulation
 */
export const getSiteCalculationById = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;

    const calculation = await prisma.siteCalculation.findUnique({
      where: { id },
      include: {
        site: {
          select: { id: true, name: true, address: true, city: true },
        },
        calculator: {
          select: { id: true, firstName: true, lastName: true },
        },
        priceModel: true,
      },
    });

    if (!calculation) {
      return res.status(404).json({
        success: false,
        message: 'Kalkulation nicht gefunden',
      });
    }

    logger.info(`Fetched calculation: ${id}`);

    res.json({
      success: true,
      data: calculation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/sites/:siteId/calculations
 * Neue Kalkulation anlegen & berechnen
 */
export const createSiteCalculation = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { siteId } = req.params;
    const userId = req.user!.id;
    const data = req.body;

    // Site existiert?
    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Objekt nicht gefunden',
      });
    }

    // Next version number
    const lastCalculation = await prisma.siteCalculation.findFirst({
      where: { siteId },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (lastCalculation?.version || 0) + 1;

    // Get price model (if specified)
    let priceModel = null;
    if (data.priceModelId) {
      priceModel = await prisma.priceModel.findUnique({
        where: { id: data.priceModelId },
      });
    }

    // Calculate costs
    const calculated = await calculateCosts(data, priceModel);

    // Create calculation
    const calculation = await prisma.siteCalculation.create({
      data: {
        siteId,
        priceModelId: data.priceModelId || null,
        version: nextVersion,
        status: 'DRAFT',

        // Requirements
        requiredStaff: data.requiredStaff || 1,
        hoursPerWeek: data.hoursPerWeek || 40,
        contractDurationMonths: data.contractDurationMonths || 12,

        // Time distribution
        hoursDay: data.hoursDay || 40,
        hoursNight: data.hoursNight || 0,
        hoursSaturday: data.hoursSaturday || 0,
        hoursSunday: data.hoursSunday || 0,
        hoursHoliday: data.hoursHoliday || 0,

        // Staff structure
        employeeCount: data.employeeCount || 1,
        shiftLeaderCount: data.shiftLeaderCount || 0,
        siteManagerCount: data.siteManagerCount || 0,

        // Custom rates (optional)
        customHourlyRateEmployee: data.customHourlyRateEmployee || null,
        customHourlyRateShiftLeader: data.customHourlyRateShiftLeader || null,
        customHourlyRateSiteManager: data.customHourlyRateSiteManager || null,

        // Custom surcharges (optional)
        customNightSurcharge: data.customNightSurcharge || null,
        customSaturdaySurcharge: data.customSaturdaySurcharge || null,
        customSundaySurcharge: data.customSundaySurcharge || null,
        customHolidaySurcharge: data.customHolidaySurcharge || null,

        // Surcharges
        riskSurchargePercentage: data.riskSurchargePercentage || 0,
        distanceSurcharge: data.distanceSurcharge || 0,

        // Custom overhead & margin (optional)
        customOverheadPercentage: data.customOverheadPercentage || null,
        customProfitMarginPercentage: data.customProfitMarginPercentage || null,

        // Calculated costs
        totalPersonnelCostMonthly: calculated.totalPersonnelCost,
        totalOverheadMonthly: calculated.totalOverhead,
        totalProfitMonthly: calculated.totalProfit,
        totalPriceMonthly: calculated.totalPrice,

        // Setup costs
        setupCostUniform: data.setupCostUniform || 0,
        setupCostEquipment: data.setupCostEquipment || 0,
        setupCostOther: data.setupCostOther || 0,

        // Notes
        notes: data.notes || null,

        // Meta
        calculatedBy: userId,
      },
      include: {
        calculator: {
          select: { id: true, firstName: true, lastName: true },
        },
        priceModel: {
          select: { id: true, name: true },
        },
      },
    });

    logger.info(`Created calculation: ${calculation.id} for site ${siteId}`);

    res.status(201).json({
      success: true,
      message: 'Kalkulation erfolgreich erstellt',
      data: calculation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/sites/:siteId/calculations/:id
 * Kalkulation bearbeiten & neu berechnen
 */
export const updateSiteCalculation = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const data = req.body;

    const calculation = await prisma.siteCalculation.findUnique({ where: { id } });
    if (!calculation) {
      return res.status(404).json({
        success: false,
        message: 'Kalkulation nicht gefunden',
      });
    }

    // Can only edit DRAFT calculations
    if (calculation.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Nur Entwürfe können bearbeitet werden',
      });
    }

    // Get price model (if specified)
    let priceModel = null;
    if (data.priceModelId) {
      priceModel = await prisma.priceModel.findUnique({
        where: { id: data.priceModelId },
      });
    }

    // Recalculate costs
    const calculated = await calculateCosts(data, priceModel);

    // Update calculation
    const updated = await prisma.siteCalculation.update({
      where: { id },
      data: {
        ...(data.priceModelId !== undefined && { priceModelId: data.priceModelId }),
        ...(data.requiredStaff !== undefined && { requiredStaff: data.requiredStaff }),
        ...(data.hoursPerWeek !== undefined && { hoursPerWeek: data.hoursPerWeek }),
        ...(data.contractDurationMonths !== undefined && { contractDurationMonths: data.contractDurationMonths }),
        ...(data.hoursDay !== undefined && { hoursDay: data.hoursDay }),
        ...(data.hoursNight !== undefined && { hoursNight: data.hoursNight }),
        ...(data.hoursSaturday !== undefined && { hoursSaturday: data.hoursSaturday }),
        ...(data.hoursSunday !== undefined && { hoursSunday: data.hoursSunday }),
        ...(data.hoursHoliday !== undefined && { hoursHoliday: data.hoursHoliday }),
        ...(data.employeeCount !== undefined && { employeeCount: data.employeeCount }),
        ...(data.shiftLeaderCount !== undefined && { shiftLeaderCount: data.shiftLeaderCount }),
        ...(data.siteManagerCount !== undefined && { siteManagerCount: data.siteManagerCount }),
        ...(data.customHourlyRateEmployee !== undefined && { customHourlyRateEmployee: data.customHourlyRateEmployee }),
        ...(data.customHourlyRateShiftLeader !== undefined && { customHourlyRateShiftLeader: data.customHourlyRateShiftLeader }),
        ...(data.customHourlyRateSiteManager !== undefined && { customHourlyRateSiteManager: data.customHourlyRateSiteManager }),
        ...(data.customNightSurcharge !== undefined && { customNightSurcharge: data.customNightSurcharge }),
        ...(data.customSaturdaySurcharge !== undefined && { customSaturdaySurcharge: data.customSaturdaySurcharge }),
        ...(data.customSundaySurcharge !== undefined && { customSundaySurcharge: data.customSundaySurcharge }),
        ...(data.customHolidaySurcharge !== undefined && { customHolidaySurcharge: data.customHolidaySurcharge }),
        ...(data.riskSurchargePercentage !== undefined && { riskSurchargePercentage: data.riskSurchargePercentage }),
        ...(data.distanceSurcharge !== undefined && { distanceSurcharge: data.distanceSurcharge }),
        ...(data.customOverheadPercentage !== undefined && { customOverheadPercentage: data.customOverheadPercentage }),
        ...(data.customProfitMarginPercentage !== undefined && { customProfitMarginPercentage: data.customProfitMarginPercentage }),
        ...(data.setupCostUniform !== undefined && { setupCostUniform: data.setupCostUniform }),
        ...(data.setupCostEquipment !== undefined && { setupCostEquipment: data.setupCostEquipment }),
        ...(data.setupCostOther !== undefined && { setupCostOther: data.setupCostOther }),
        ...(data.notes !== undefined && { notes: data.notes }),

        // Update calculated costs
        totalPersonnelCostMonthly: calculated.totalPersonnelCost,
        totalOverheadMonthly: calculated.totalOverhead,
        totalProfitMonthly: calculated.totalProfit,
        totalPriceMonthly: calculated.totalPrice,
      },
      include: {
        calculator: {
          select: { id: true, firstName: true, lastName: true },
        },
        priceModel: {
          select: { id: true, name: true },
        },
      },
    });

    logger.info(`Updated calculation: ${id}`);

    res.json({
      success: true,
      message: 'Kalkulation erfolgreich aktualisiert',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/sites/:siteId/calculations/:id
 * Kalkulation löschen
 */
export const deleteSiteCalculation = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;

    const calculation = await prisma.siteCalculation.findUnique({ where: { id } });
    if (!calculation) {
      return res.status(404).json({
        success: false,
        message: 'Kalkulation nicht gefunden',
      });
    }

    // Can only delete DRAFT or REJECTED calculations
    if (!['DRAFT', 'REJECTED', 'ARCHIVED'].includes(calculation.status)) {
      return res.status(400).json({
        success: false,
        message: 'Nur Entwürfe, abgelehnte oder archivierte Kalkulationen können gelöscht werden',
      });
    }

    await prisma.siteCalculation.delete({ where: { id } });

    logger.info(`Deleted calculation: ${id}`);

    res.json({
      success: true,
      message: 'Kalkulation erfolgreich gelöscht',
    });
  } catch (error) {
    next(error);
  }
};

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

/**
 * POST /api/sites/:siteId/calculations/:id/duplicate
 * Dupliziert eine Kalkulation (erstellt neue Version als DRAFT)
 */
export const duplicateSiteCalculation = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { siteId, id } = req.params;
    const userId = (req as any).user.id;

    const original = await prisma.siteCalculation.findUnique({ where: { id } });
    if (!original || original.siteId !== siteId) {
      return res.status(404).json({
        success: false,
        message: 'Kalkulation nicht gefunden',
      });
    }

    // Get highest version for this site
    const latestCalculation = await prisma.siteCalculation.findFirst({
      where: { siteId },
      orderBy: { version: 'desc' },
    });

    const newVersion = (latestCalculation?.version || 0) + 1;

    // Create duplicate with incremented version
    const duplicate = await prisma.siteCalculation.create({
      data: {
        siteId: original.siteId,
        priceModelId: original.priceModelId,
        version: newVersion,
        status: 'DRAFT',

        requiredStaff: original.requiredStaff,
        hoursPerWeek: original.hoursPerWeek,
        contractDurationMonths: original.contractDurationMonths,

        hoursDay: original.hoursDay,
        hoursNight: original.hoursNight,
        hoursSaturday: original.hoursSaturday,
        hoursSunday: original.hoursSunday,
        hoursHoliday: original.hoursHoliday,

        employeeCount: original.employeeCount,
        shiftLeaderCount: original.shiftLeaderCount,
        siteManagerCount: original.siteManagerCount,

        customHourlyRateEmployee: original.customHourlyRateEmployee,
        customHourlyRateShiftLeader: original.customHourlyRateShiftLeader,
        customHourlyRateSiteManager: original.customHourlyRateSiteManager,

        customNightSurcharge: original.customNightSurcharge,
        customSaturdaySurcharge: original.customSaturdaySurcharge,
        customSundaySurcharge: original.customSundaySurcharge,
        customHolidaySurcharge: original.customHolidaySurcharge,

        riskSurchargePercentage: original.riskSurchargePercentage,
        distanceSurcharge: original.distanceSurcharge,

        customOverheadPercentage: original.customOverheadPercentage,
        customProfitMarginPercentage: original.customProfitMarginPercentage,

        totalPersonnelCostMonthly: original.totalPersonnelCostMonthly,
        totalOverheadMonthly: original.totalOverheadMonthly,
        totalProfitMonthly: original.totalProfitMonthly,
        totalPriceMonthly: original.totalPriceMonthly,

        setupCostUniform: original.setupCostUniform,
        setupCostEquipment: original.setupCostEquipment,
        setupCostOther: original.setupCostOther,

        notes: original.notes,

        calculatedBy: userId,
        calculatedAt: new Date(),
      },
    });

    logger.info(`Duplicated calculation ${id} as new version ${newVersion} (${duplicate.id})`);

    res.json({
      success: true,
      message: `Kalkulation erfolgreich dupliziert (Version ${newVersion})`,
      data: duplicate,
    });
  } catch (error) {
    next(error);
  }
};

// ===== HELPER: CALCULATION LOGIC =====

/**
 * Calculate costs based on input data and price model
 */
async function calculateCosts(data: any, priceModel: any | null) {
  // Get rates (custom or from price model or defaults)
  const hourlyRateEmployee = data.customHourlyRateEmployee || priceModel?.hourlyRateEmployee || 13.5;
  const hourlyRateShiftLeader = data.customHourlyRateShiftLeader || priceModel?.hourlyRateShiftLeader || 16.0;
  const hourlyRateSiteManager = data.customHourlyRateSiteManager || priceModel?.hourlyRateSiteManager || 18.5;

  // Get surcharges (custom or from price model or defaults)
  const nightSurcharge = data.customNightSurcharge !== undefined ? data.customNightSurcharge : (priceModel?.nightSurcharge || 25);
  const saturdaySurcharge = data.customSaturdaySurcharge !== undefined ? data.customSaturdaySurcharge : (priceModel?.saturdaySurcharge || 25);
  const sundaySurcharge = data.customSundaySurcharge !== undefined ? data.customSundaySurcharge : (priceModel?.sundaySurcharge || 50);
  const holidaySurcharge = data.customHolidaySurcharge !== undefined ? data.customHolidaySurcharge : (priceModel?.holidaySurcharge || 100);

  // Get overhead & margin (custom or from price model or defaults)
  const overheadPercentage = data.customOverheadPercentage !== undefined ? data.customOverheadPercentage : (priceModel?.overheadPercentage || 12);
  const profitMarginPercentage = data.customProfitMarginPercentage !== undefined ? data.customProfitMarginPercentage : (priceModel?.profitMarginPercentage || 15);

  // Time distribution (hours per week)
  const hoursDay = data.hoursDay || 40;
  const hoursNight = data.hoursNight || 0;
  const hoursSaturday = data.hoursSaturday || 0;
  const hoursSunday = data.hoursSunday || 0;
  const hoursHoliday = data.hoursHoliday || 0;

  // Calculate monthly hours (4.3 weeks per month average)
  const weeksPerMonth = 4.3;

  // Calculate costs for each time type (per month)
  const dayRate = hourlyRateEmployee;
  const nightRate = hourlyRateEmployee * (1 + nightSurcharge / 100);
  const saturdayRate = hourlyRateEmployee * (1 + saturdaySurcharge / 100);
  const sundayRate = hourlyRateEmployee * (1 + sundaySurcharge / 100);
  const holidayRate = hourlyRateEmployee * (1 + holidaySurcharge / 100);

  const costDay = hoursDay * weeksPerMonth * dayRate;
  const costNight = hoursNight * weeksPerMonth * nightRate;
  const costSaturday = hoursSaturday * weeksPerMonth * saturdayRate;
  const costSunday = hoursSunday * weeksPerMonth * sundayRate;
  const costHoliday = hoursHoliday * weeksPerMonth * holidayRate;

  // Total personnel cost (before risk & distance surcharges)
  let totalPersonnelCost = costDay + costNight + costSaturday + costSunday + costHoliday;

  // Apply risk surcharge
  if (data.riskSurchargePercentage) {
    totalPersonnelCost *= (1 + data.riskSurchargePercentage / 100);
  }

  // Apply distance surcharge (per hour)
  if (data.distanceSurcharge) {
    const totalHoursPerMonth = (hoursDay + hoursNight + hoursSaturday + hoursSunday + hoursHoliday) * weeksPerMonth;
    totalPersonnelCost += data.distanceSurcharge * totalHoursPerMonth;
  }

  // Calculate overhead
  const totalOverhead = totalPersonnelCost * (overheadPercentage / 100);

  // Calculate profit
  const totalProfit = (totalPersonnelCost + totalOverhead) * (profitMarginPercentage / 100);

  // Total price (monthly, netto)
  const totalPrice = totalPersonnelCost + totalOverhead + totalProfit;

  return {
    totalPersonnelCost: Math.round(totalPersonnelCost * 100) / 100,
    totalOverhead: Math.round(totalOverhead * 100) / 100,
    totalProfit: Math.round(totalProfit * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,
  };
}

/**
 * GET /api/sites/:siteId/calculations/:id/pdf
 * Generiert PDF-Angebot für eine Kalkulation
 */
export const generateCalculationPDF = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { siteId, id } = req.params;
    const PDFDocument = require('pdfkit');

    // Fetch calculation with all relations
    const calculation = await prisma.siteCalculation.findUnique({
      where: { id },
      include: {
        site: true,
        calculator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        priceModel: true,
      },
    });

    if (!calculation || calculation.siteId !== siteId) {
      return res.status(404).json({
        success: false,
        message: 'Kalkulation nicht gefunden',
      });
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Angebot_${calculation.site.name}_v${calculation.version}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Helper function for formatting currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    // Helper function for formatting date
    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('de-DE').format(new Date(date));
    };

    // === HEADER ===
    doc.fontSize(20).font('Helvetica-Bold').text('ANGEBOT', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(`Version ${calculation.version}`, { align: 'center' });
    doc.fontSize(10).text(`Erstellt am: ${formatDate(calculation.createdAt)}`, { align: 'center' });
    doc.moveDown(2);

    // === OBJEKT-INFORMATIONEN ===
    doc.fontSize(14).font('Helvetica-Bold').text('Objekt-Informationen', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Objekt: ${calculation.site.name}`);
    doc.text(`Adresse: ${calculation.site.address}, ${calculation.site.postalCode} ${calculation.site.city}`);
    if (calculation.site.customerName) {
      doc.text(`Kunde: ${calculation.site.customerName}`);
    }
    if (calculation.site.customerEmail) {
      doc.text(`Email: ${calculation.site.customerEmail}`);
    }
    doc.moveDown(1.5);

    // === ZEITVERTEILUNG ===
    doc.fontSize(14).font('Helvetica-Bold').text('Zeitverteilung (Stunden pro Woche)', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Tagsüber (Mo-Fr): ${calculation.hoursDay} Std.`);
    doc.text(`Nachts (Mo-Fr): ${calculation.hoursNight} Std.`);
    doc.text(`Samstag: ${calculation.hoursSaturday} Std.`);
    doc.text(`Sonntag: ${calculation.hoursSunday} Std.`);
    doc.text(`Feiertag: ${calculation.hoursHoliday} Std.`);
    const totalHoursWeek = calculation.hoursDay + calculation.hoursNight + calculation.hoursSaturday + calculation.hoursSunday + calculation.hoursHoliday;
    doc.font('Helvetica-Bold').text(`Gesamt: ${totalHoursWeek} Std./Woche`, { continued: false });
    doc.moveDown(1.5);

    // === KOSTENÜBERSICHT ===
    doc.fontSize(14).font('Helvetica-Bold').text('Kostenübersicht (monatlich)', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');

    const costItems = [
      { label: 'Personalkosten', value: calculation.totalPersonnelCostMonthly },
      { label: 'Gemeinkosten', value: calculation.totalOverheadMonthly },
      { label: 'Gewinnmarge', value: calculation.totalProfitMonthly },
    ];

    costItems.forEach(item => {
      doc.text(`${item.label}:`, 50, doc.y, { continued: true, width: 350 });
      doc.text(formatCurrency(item.value), { align: 'right' });
    });

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // GESAMTPREIS (highlighted)
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('GESAMTPREIS (monatlich, netto):', 50, doc.y, { continued: true, width: 350 });
    doc.fontSize(14).text(formatCurrency(calculation.totalPriceMonthly), { align: 'right' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Oblique').text('zzgl. gesetzlicher MwSt.', { align: 'right' });
    doc.moveDown(2);

    // === ZUSCHLÄGE (if any) ===
    if (calculation.riskSurchargePercentage > 0 || calculation.distanceSurcharge > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('Zuschläge', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      if (calculation.riskSurchargePercentage > 0) {
        doc.text(`Risikozuschlag: ${calculation.riskSurchargePercentage}%`);
      }
      if (calculation.distanceSurcharge > 0) {
        doc.text(`Distanzzuschlag: ${formatCurrency(calculation.distanceSurcharge)}/Std.`);
      }
      doc.moveDown(1.5);
    }

    // === NOTIZEN ===
    if (calculation.notes) {
      doc.fontSize(14).font('Helvetica-Bold').text('Anmerkungen', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text(calculation.notes, { align: 'justify' });
      doc.moveDown(1.5);
    }

    // === FOOTER ===
    doc.fontSize(8).font('Helvetica-Oblique');
    doc.text('Dieses Angebot ist gültig für 30 Tage ab Erstellungsdatum.', 50, doc.page.height - 100, { align: 'center' });
    doc.text(`Erstellt von: ${calculation.calculator.firstName} ${calculation.calculator.lastName} (${calculation.calculator.email})`, { align: 'center' });

    // Finalize PDF
    doc.end();

    logger.info(`Generated PDF for calculation ${id} of site ${siteId}`);
  } catch (error) {
    next(error);
  }
};
