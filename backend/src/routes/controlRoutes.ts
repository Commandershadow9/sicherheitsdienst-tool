import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { asyncHandler } from '../middleware/asyncHandler';
import * as controlPointController from '../controllers/controlPointController';
import * as controlRoundController from '../controllers/controlRoundController';

const router = Router();

// ===== KONTROLLPUNKTE-VERWALTUNG (Desktop, Admin/Manager) =====

// GET /api/sites/:siteId/control-points - Liste aller Kontrollpunkte
router.get(
  '/sites/:siteId/control-points',
  authenticate,
  requireRole(['ADMIN', 'MANAGER', 'DISPATCHER']),
  asyncHandler(controlPointController.getControlPoints),
);

// GET /api/sites/:siteId/control-points/:id - Details
router.get(
  '/sites/:siteId/control-points/:id',
  authenticate,
  requireRole(['ADMIN', 'MANAGER', 'DISPATCHER']),
  asyncHandler(controlPointController.getControlPointById),
);

// POST /api/sites/:siteId/control-points - Neuen Punkt anlegen
router.post(
  '/sites/:siteId/control-points',
  authenticate,
  requireRole(['ADMIN', 'MANAGER']),
  asyncHandler(controlPointController.createControlPoint),
);

// PUT /api/sites/:siteId/control-points/:id - Punkt bearbeiten
router.put(
  '/sites/:siteId/control-points/:id',
  authenticate,
  requireRole(['ADMIN', 'MANAGER']),
  asyncHandler(controlPointController.updateControlPoint),
);

// DELETE /api/sites/:siteId/control-points/:id - Punkt löschen (soft delete)
router.delete(
  '/sites/:siteId/control-points/:id',
  authenticate,
  requireRole(['ADMIN', 'MANAGER']),
  asyncHandler(controlPointController.deleteControlPoint),
);

// POST /api/sites/:siteId/control-points/:id/generate-qr - QR-Code generieren
router.post(
  '/sites/:siteId/control-points/:id/generate-qr',
  authenticate,
  requireRole(['ADMIN', 'MANAGER']),
  asyncHandler(controlPointController.generateQRCode),
);

// GET /api/control-points/:id/history - Scan-Historie
router.get(
  '/control-points/:id/history',
  authenticate,
  requireRole(['ADMIN', 'MANAGER', 'DISPATCHER']),
  asyncHandler(controlPointController.getControlPointHistory),
);

// ===== KONTROLLGÄNGE (Mobile, alle Rollen) =====

// GET /api/sites/:siteId/control-rounds - Liste aller Kontrollgänge
router.get(
  '/sites/:siteId/control-rounds',
  authenticate,
  requireRole(['ADMIN', 'MANAGER', 'DISPATCHER']),
  asyncHandler(controlRoundController.getControlRounds),
);

// GET /api/control-rounds/:id - Details eines Kontrollgangs
router.get(
  '/control-rounds/:id',
  authenticate,
  // Alle Rollen dürfen eigene Runden ansehen
  asyncHandler(controlRoundController.getControlRoundById),
);

// POST /api/sites/:siteId/control-rounds - Kontrollgang starten
router.post(
  '/sites/:siteId/control-rounds',
  authenticate,
  // Alle aktiven MA dürfen Kontrollgänge starten
  asyncHandler(controlRoundController.startControlRound),
);

// POST /api/control-rounds/:roundId/scans - Kontrollpunkt scannen
router.post(
  '/control-rounds/:roundId/scans',
  authenticate,
  // Alle MA dürfen scannen
  asyncHandler(controlRoundController.createScan),
);

// PUT /api/control-rounds/:roundId/complete - Kontrollgang beenden
router.put(
  '/control-rounds/:roundId/complete',
  authenticate,
  // Alle MA dürfen eigene Runden beenden
  asyncHandler(controlRoundController.completeControlRound),
);

// GET /api/control-rounds/:roundId/report - Protokoll (PDF)
router.get(
  '/control-rounds/:roundId/report',
  authenticate,
  requireRole(['ADMIN', 'MANAGER', 'DISPATCHER']),
  asyncHandler(controlRoundController.generateReport),
);

// ===== STATISTIKEN =====

// GET /api/sites/:siteId/control-stats - Statistiken
router.get(
  '/sites/:siteId/control-stats',
  authenticate,
  requireRole(['ADMIN', 'MANAGER', 'DISPATCHER']),
  asyncHandler(controlRoundController.getControlStats),
);

export default router;
