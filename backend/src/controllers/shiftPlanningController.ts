/**
 * Shift Planning Controller
 * Erweiterte Schichtplanungs-Endpunkte (v2.0)
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { submitAuditEvent } from '../utils/audit';

// Template Service
import * as templateService from '../services/shiftTemplateService';

// Conflict Service
import * as conflictService from '../services/shiftConflictService';

// Auto-Fill Service
import * as autoFillService from '../services/shiftAutoFillService';

// ===== SHIFT TEMPLATES =====

/**
 * GET /api/shift-planning/templates
 * Listet alle Schicht-Templates
 */
export const listTemplates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isActive, shiftType, category } = req.query;

    const templates = await templateService.listShiftTemplates({
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      shiftType: shiftType as any,
      category: category as string,
    });

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/shift-planning/templates/:id
 * Ruft ein einzelnes Template ab
 */
export const getTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const template = await templateService.getShiftTemplate(id);

    if (!template) {
      res.status(404).json({
        success: false,
        message: 'Template nicht gefunden',
      });
      return;
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/shift-planning/templates
 * Erstellt ein neues Template
 */
export const createTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await templateService.createShiftTemplate(req.body);

    await submitAuditEvent(req, {
      action: 'CREATE',
      resourceType: 'SHIFT_TEMPLATE',
      resourceId: template.id,
      outcome: 'SUCCESS',
    });

    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/shift-planning/templates/:id
 * Aktualisiert ein Template
 */
export const updateTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const template = await templateService.updateShiftTemplate(id, req.body);

    await submitAuditEvent(req, {
      action: 'UPDATE',
      resourceType: 'SHIFT_TEMPLATE',
      resourceId: id,
      outcome: 'SUCCESS',
    });

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/shift-planning/templates/:id
 * Löscht ein Template
 */
export const deleteTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await templateService.deleteShiftTemplate(id);

    await submitAuditEvent(req, {
      action: 'DELETE',
      resourceType: 'SHIFT_TEMPLATE',
      resourceId: id,
      outcome: 'SUCCESS',
    });

    res.json({
      success: true,
      message: 'Template gelöscht',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/shift-planning/templates/:id/apply
 * Wendet Template auf eine Site an
 */
export const applyTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { siteId } = req.body;

    if (!siteId) {
      res.status(400).json({
        success: false,
        message: 'siteId ist erforderlich',
      });
      return;
    }

    const site = await templateService.applyTemplateToSite(id, siteId);

    await submitAuditEvent(req, {
      action: 'APPLY_TEMPLATE',
      resourceType: 'SITE',
      resourceId: siteId,
      data: { templateId: id },
      outcome: 'SUCCESS',
    });

    res.json({
      success: true,
      data: site,
      message: 'Template erfolgreich angewendet',
    });
  } catch (error) {
    next(error);
  }
};

// ===== CONFLICT ANALYSIS =====

/**
 * GET /api/shift-planning/conflicts
 * Analysiert Konflikte in einem Zeitraum
 */
export const analyzeConflicts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, siteId, userId } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        message: 'startDate und endDate sind erforderlich',
      });
      return;
    }

    const conflicts = await conflictService.analyzeShiftConflicts({
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      siteId: siteId as string | undefined,
      userId: userId as string | undefined,
    });

    // Gruppiere Konflikte nach Schweregrad
    const stats = {
      total: conflicts.length,
      critical: conflicts.filter((c) => c.severity === 'critical').length,
      high: conflicts.filter((c) => c.severity === 'high').length,
      medium: conflicts.filter((c) => c.severity === 'medium').length,
      low: conflicts.filter((c) => c.severity === 'low').length,
    };

    res.json({
      success: true,
      data: {
        conflicts,
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/shift-planning/conflicts/:shiftId
 * Ruft Konflikte für eine spezifische Schicht ab
 */
export const getShiftConflicts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shiftId } = req.params;

    const conflicts = await conflictService.getShiftConflicts(shiftId);

    res.json({
      success: true,
      data: conflicts,
    });
  } catch (error) {
    next(error);
  }
};

// ===== AUTO-FILL =====

/**
 * POST /api/shift-planning/auto-fill
 * Füllt Schichten automatisch
 */
export const autoFillShifts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shiftIds, autoAssign, preferenceWeight, fairnessWeight } = req.body;

    if (!shiftIds || !Array.isArray(shiftIds) || shiftIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'shiftIds (Array) ist erforderlich',
      });
      return;
    }

    const results = await autoFillService.autoFillShifts({
      shiftIds,
      autoAssign: autoAssign || false,
      preferenceWeight: preferenceWeight || 50,
      fairnessWeight: fairnessWeight || 50,
    });

    await submitAuditEvent(req, {
      action: 'AUTO_FILL',
      resourceType: 'SHIFT',
      data: { shiftIds, autoAssign, count: results.length },
      outcome: 'SUCCESS',
    });

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/shift-planning/auto-fill-period
 * Füllt alle Schichten in einem Zeitraum automatisch
 */
export const autoFillPeriod = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, siteId, autoAssign } = req.body;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        message: 'startDate und endDate sind erforderlich',
      });
      return;
    }

    const results = await autoFillService.autoFillPeriod({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      siteId: siteId || undefined,
      autoAssign: autoAssign || false,
    });

    await submitAuditEvent(req, {
      action: 'AUTO_FILL_PERIOD',
      resourceType: 'SHIFT',
      data: { startDate, endDate, siteId, autoAssign, count: results.length },
      outcome: 'SUCCESS',
    });

    res.json({
      success: true,
      data: results,
      message: `${results.length} Schichten verarbeitet`,
    });
  } catch (error) {
    next(error);
  }
};

// ===== SEED =====

/**
 * POST /api/shift-planning/seed-templates
 * Erstellt Standard-Templates (Development/Setup)
 */
export const seedTemplates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Nur für Admins
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Keine Berechtigung',
      });
      return;
    }

    const templates = await templateService.seedDefaultTemplates();

    res.json({
      success: true,
      data: templates,
      message: `${templates.length} Standard-Templates erstellt`,
    });
  } catch (error) {
    next(error);
  }
};
