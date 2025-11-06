import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { sendCalculationEmail } from '../services/emailService';

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

/**
 * POST /api/sites/:siteId/calculations/:id/send-email
 * E-Mail-Versand für Kalkulation
 */
export const sendCalculationEmailEndpoint = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { siteId, id } = req.params;
    const { recipientEmail } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        message: 'Empfänger-E-Mail ist erforderlich',
      });
    }

    // Kalkulation mit allen Relations laden
    const calculation = await prisma.siteCalculation.findUnique({
      where: { id },
      include: {
        site: true,
        calculator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!calculation) {
      return res.status(404).json({
        success: false,
        message: 'Kalkulation nicht gefunden',
      });
    }

    if (calculation.siteId !== siteId) {
      return res.status(400).json({
        success: false,
        message: 'Kalkulation gehört nicht zu diesem Objekt',
      });
    }

    const calculatorName = `${calculation.calculator.firstName} ${calculation.calculator.lastName}`;

    // E-Mail asynchron versenden (fire-and-forget)
    sendCalculationEmail(
      recipientEmail,
      calculation.site.name,
      calculation.version,
      calculation.totalPriceMonthly,
      calculatorName,
      siteId,
      id,
    ).catch((error) => {
      logger.error('E-Mail-Versand fehlgeschlagen:', error);
    });

    logger.info(`Email for calculation ${id} queued for sending to ${recipientEmail}`);

    res.json({
      success: true,
      message: 'E-Mail wird versendet',
    });
  } catch (error) {
    next(error);
  }
};
