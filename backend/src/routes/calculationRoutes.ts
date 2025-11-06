import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { asyncHandler } from '../middleware/asyncHandler';
import * as priceModelController from '../controllers/priceModelController';
import * as calculationController from '../controllers/calculationController';
import * as calculationStatusController from '../controllers/calculationStatusController';
import * as calculationOperationsController from '../controllers/calculationOperationsController';

const router = Router();

// ===== PREISMODELLE (Templates) =====

// GET /api/price-models - Liste aller Preismodelle
router.get(
  '/price-models',
  authenticate,
  requireRole(['ADMIN', 'MANAGER']),
  asyncHandler(priceModelController.getPriceModels),
);

// GET /api/price-models/:id - Details
router.get(
  '/price-models/:id',
  authenticate,
  requireRole(['ADMIN', 'MANAGER']),
  asyncHandler(priceModelController.getPriceModelById),
);

// POST /api/price-models - Neues Preismodell
router.post(
  '/price-models',
  authenticate,
  requireRole(['ADMIN']),
  asyncHandler(priceModelController.createPriceModel),
);

// PUT /api/price-models/:id - Preismodell bearbeiten
router.put(
  '/price-models/:id',
  authenticate,
  requireRole(['ADMIN']),
  asyncHandler(priceModelController.updatePriceModel),
);

// DELETE /api/price-models/:id - Preismodell löschen
router.delete(
  '/price-models/:id',
  authenticate,
  requireRole(['ADMIN']),
  asyncHandler(priceModelController.deletePriceModel),
);

// ===== KALKULATIONEN (pro Objekt) =====

// GET /api/sites/:siteId/calculations - Liste aller Kalkulationen
router.get(
  '/sites/:siteId/calculations',
  authenticate,
  requireRole(['ADMIN', 'MANAGER', 'DISPATCHER']),
  asyncHandler(calculationController.getSiteCalculations),
);

// GET /api/sites/:siteId/calculations/:id - Details
router.get(
  '/sites/:siteId/calculations/:id',
  authenticate,
  requireRole(['ADMIN', 'MANAGER', 'DISPATCHER']),
  asyncHandler(calculationController.getSiteCalculationById),
);

// POST /api/sites/:siteId/calculations - Neue Kalkulation
router.post(
  '/sites/:siteId/calculations',
  authenticate,
  requireRole(['ADMIN', 'MANAGER']),
  asyncHandler(calculationController.createSiteCalculation),
);

// PUT /api/sites/:siteId/calculations/:id - Kalkulation bearbeiten
router.put(
  '/sites/:siteId/calculations/:id',
  authenticate,
  requireRole(['ADMIN', 'MANAGER']),
  asyncHandler(calculationController.updateSiteCalculation),
);

// DELETE /api/sites/:siteId/calculations/:id - Kalkulation löschen
router.delete(
  '/sites/:siteId/calculations/:id',
  authenticate,
  requireRole(['ADMIN', 'MANAGER']),
  asyncHandler(calculationController.deleteSiteCalculation),
);

// ===== KALKULATIONS-AKTIONEN =====

// POST /api/sites/:siteId/calculations/:id/send - Versenden
router.post(
  '/sites/:siteId/calculations/:id/send',
  authenticate,
  requireRole(['ADMIN', 'MANAGER']),
  asyncHandler(calculationStatusController.sendSiteCalculation),
);

// POST /api/sites/:siteId/calculations/:id/send-email - E-Mail versenden
router.post(
  '/sites/:siteId/calculations/:id/send-email',
  authenticate,
  requireRole(['ADMIN', 'MANAGER']),
  asyncHandler(calculationOperationsController.sendCalculationEmailEndpoint),
);

// POST /api/sites/:siteId/calculations/:id/accept - Annehmen
router.post(
  '/sites/:siteId/calculations/:id/accept',
  authenticate,
  requireRole(['ADMIN', 'MANAGER']),
  asyncHandler(calculationStatusController.acceptSiteCalculation),
);

// POST /api/sites/:siteId/calculations/:id/reject - Ablehnen
router.post(
  '/sites/:siteId/calculations/:id/reject',
  authenticate,
  requireRole(['ADMIN', 'MANAGER']),
  asyncHandler(calculationStatusController.rejectSiteCalculation),
);

// POST /api/sites/:siteId/calculations/:id/archive - Archivieren
router.post(
  '/sites/:siteId/calculations/:id/archive',
  authenticate,
  requireRole(['ADMIN', 'MANAGER']),
  asyncHandler(calculationStatusController.archiveSiteCalculation),
);

// POST /api/sites/:siteId/calculations/:id/duplicate - Duplizieren
router.post(
  '/sites/:siteId/calculations/:id/duplicate',
  authenticate,
  requireRole(['ADMIN', 'MANAGER']),
  asyncHandler(calculationOperationsController.duplicateSiteCalculation),
);

// GET /api/sites/:siteId/calculations/:id/pdf - PDF-Export
router.get(
  '/sites/:siteId/calculations/:id/pdf',
  authenticate,
  requireRole(['ADMIN', 'MANAGER', 'DISPATCHER']),
  asyncHandler(calculationOperationsController.generateCalculationPDF),
);

export default router;
