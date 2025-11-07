import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import logger from '../utils/logger';

// GET /api/sites/:siteId/shift-rules - Alle Schichtregeln für ein Site
export const getShiftRules = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { siteId } = req.params;

    const rules = await prisma.shiftRule.findMany({
      where: { siteId },
      orderBy: [
        { priority: 'desc' }, // Höchste Priorität zuerst
        { validFrom: 'asc' },
      ],
    });

    res.json({ success: true, data: rules });
  } catch (error) {
    next(error);
  }
};

// GET /api/sites/:siteId/shift-rules/:ruleId - Einzelne Regel
export const getShiftRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { siteId, ruleId } = req.params;

    const rule = await prisma.shiftRule.findFirst({
      where: { id: ruleId, siteId },
    });

    if (!rule) {
      res.status(404).json({ success: false, message: 'Schichtregel nicht gefunden' });
      return;
    }

    res.json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

// POST /api/sites/:siteId/shift-rules - Neue Regel erstellen
export const createShiftRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { siteId } = req.params;
    const {
      name,
      startTime,
      endTime,
      requiredStaff,
      requiredQualifications = [],
      pattern,
      daysOfWeek = [],
      specificDates = [],
      validFrom,
      validUntil,
      priority = 0,
      description,
      isActive = true,
    } = req.body;

    // Validierung
    if (!name || !startTime || !endTime || !validFrom || !pattern) {
      res.status(400).json({
        success: false,
        message: 'Pflichtfelder fehlen: name, startTime, endTime, validFrom, pattern',
      });
      return;
    }

    // Zeit-Format validieren (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      res.status(400).json({
        success: false,
        message: 'Ungültiges Zeitformat. Erwartet: HH:MM (z.B. 06:00)',
      });
      return;
    }

    // Pattern-spezifische Validierung
    if (pattern === 'WEEKLY' && (!daysOfWeek || daysOfWeek.length === 0)) {
      res.status(400).json({
        success: false,
        message: 'Pattern WEEKLY benötigt daysOfWeek',
      });
      return;
    }

    if (pattern === 'SPECIFIC_DATES' && (!specificDates || specificDates.length === 0)) {
      res.status(400).json({
        success: false,
        message: 'Pattern SPECIFIC_DATES benötigt specificDates',
      });
      return;
    }

    const rule = await prisma.shiftRule.create({
      data: {
        siteId,
        name,
        startTime,
        endTime,
        requiredStaff: requiredStaff || 1,
        requiredQualifications,
        pattern,
        daysOfWeek,
        specificDates: specificDates.map((d: string) => new Date(d)),
        validFrom: new Date(validFrom),
        validUntil: validUntil ? new Date(validUntil) : null,
        priority,
        description,
        isActive,
      },
    });

    logger.info(`ShiftRule created: ${rule.id} for site ${siteId}`);
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

// PUT /api/sites/:siteId/shift-rules/:ruleId - Regel aktualisieren
export const updateShiftRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { siteId, ruleId } = req.params;
    const {
      name,
      startTime,
      endTime,
      requiredStaff,
      requiredQualifications,
      pattern,
      daysOfWeek,
      specificDates,
      validFrom,
      validUntil,
      priority,
      description,
      isActive,
    } = req.body;

    // Prüfen ob Regel existiert
    const existing = await prisma.shiftRule.findFirst({
      where: { id: ruleId, siteId },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Schichtregel nicht gefunden' });
      return;
    }

    // Zeit-Format validieren falls angegeben
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (startTime && !timeRegex.test(startTime)) {
      res.status(400).json({ success: false, message: 'Ungültiges startTime Format' });
      return;
    }
    if (endTime && !timeRegex.test(endTime)) {
      res.status(400).json({ success: false, message: 'Ungültiges endTime Format' });
      return;
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (requiredStaff !== undefined) updateData.requiredStaff = requiredStaff;
    if (requiredQualifications !== undefined) updateData.requiredQualifications = requiredQualifications;
    if (pattern !== undefined) updateData.pattern = pattern;
    if (daysOfWeek !== undefined) updateData.daysOfWeek = daysOfWeek;
    if (specificDates !== undefined) updateData.specificDates = specificDates.map((d: string) => new Date(d));
    if (validFrom !== undefined) updateData.validFrom = new Date(validFrom);
    if (validUntil !== undefined) updateData.validUntil = validUntil ? new Date(validUntil) : null;
    if (priority !== undefined) updateData.priority = priority;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    const rule = await prisma.shiftRule.update({
      where: { id: ruleId },
      data: updateData,
    });

    logger.info(`ShiftRule updated: ${ruleId}`);
    res.json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/sites/:siteId/shift-rules/:ruleId - Regel löschen
export const deleteShiftRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { siteId, ruleId } = req.params;

    const existing = await prisma.shiftRule.findFirst({
      where: { id: ruleId, siteId },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Schichtregel nicht gefunden' });
      return;
    }

    await prisma.shiftRule.delete({
      where: { id: ruleId },
    });

    logger.info(`ShiftRule deleted: ${ruleId}`);
    res.json({ success: true, message: 'Schichtregel gelöscht' });
  } catch (error) {
    next(error);
  }
};

// POST /api/sites/:siteId/shift-rules/generate-shifts - Schichten aus Regeln generieren
export const generateShiftsFromRules = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { siteId } = req.params;
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        message: 'startDate und endDate sind erforderlich',
      });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      res.status(400).json({
        success: false,
        message: 'startDate muss vor endDate liegen',
      });
      return;
    }

    // Hole alle aktiven Regeln für dieses Site
    const rules = await prisma.shiftRule.findMany({
      where: {
        siteId,
        isActive: true,
        validFrom: { lte: end },
        OR: [
          { validUntil: null },
          { validUntil: { gte: start } },
        ],
      },
      orderBy: { priority: 'desc' }, // Höhere Priorität zuerst
    });

    if (rules.length === 0) {
      res.json({
        success: true,
        message: 'Keine aktiven Schichtregeln gefunden',
        data: { created: 0, shifts: [] },
      });
      return;
    }

    // Generiere Schichten
    const shiftsToCreate: any[] = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sonntag, 1 = Montag, ...
      const dateStr = currentDate.toISOString().split('T')[0];

      // Finde passende Regeln (höchste Priorität gewinnt)
      let applicableRule = null;

      for (const rule of rules) {
        // Prüfe ob Regel an diesem Tag gültig ist
        if (currentDate < new Date(rule.validFrom)) continue;
        if (rule.validUntil && currentDate > new Date(rule.validUntil)) continue;

        // Pattern-Check
        let matches = false;

        if (rule.pattern === 'DAILY' || rule.pattern === 'DATE_RANGE') {
          matches = true;
        } else if (rule.pattern === 'WEEKLY') {
          matches = rule.daysOfWeek.includes(dayOfWeek);
        } else if (rule.pattern === 'SPECIFIC_DATES') {
          matches = rule.specificDates.some(
            (d) => d.toISOString().split('T')[0] === dateStr
          );
        }

        if (matches) {
          applicableRule = rule;
          break; // Höchste Priorität gefunden
        }
      }

      if (applicableRule) {
        // Erstelle Schicht für diesen Tag
        const shiftStart = new Date(`${dateStr}T${applicableRule.startTime}:00.000Z`);
        let shiftEnd = new Date(`${dateStr}T${applicableRule.endTime}:00.000Z`);

        // Wenn endTime < startTime, geht die Schicht über Mitternacht
        if (applicableRule.endTime < applicableRule.startTime) {
          shiftEnd.setDate(shiftEnd.getDate() + 1);
        }

        shiftsToCreate.push({
          siteId,
          title: applicableRule.name,
          description: applicableRule.description || null,
          location: '', // Wird vom Site übernommen
          startTime: shiftStart,
          endTime: shiftEnd,
          requiredEmployees: applicableRule.requiredStaff,
          requiredQualifications: applicableRule.requiredQualifications,
          status: 'PLANNED',
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Batch-Insert Schichten
    if (shiftsToCreate.length > 0) {
      const created = await prisma.shift.createMany({
        data: shiftsToCreate,
        skipDuplicates: false,
      });

      logger.info(`Generated ${created.count} shifts for site ${siteId}`);
      res.json({
        success: true,
        message: `${created.count} Schichten generiert`,
        data: { created: created.count, shifts: shiftsToCreate },
      });
    } else {
      res.json({
        success: true,
        message: 'Keine Schichten generiert (keine passenden Regeln)',
        data: { created: 0, shifts: [] },
      });
    }
  } catch (error) {
    next(error);
  }
};
