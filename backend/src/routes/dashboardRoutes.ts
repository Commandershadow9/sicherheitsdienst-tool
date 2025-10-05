import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import {
  getCriticalShifts,
  getPendingApprovals,
  getWarnings,
  getStats,
} from '../controllers/dashboardController';

const router = Router();

// Alle Dashboard-Endpoints benötigen Authentifizierung
router.use(authenticate);

/**
 * GET /api/dashboard/critical
 * Heute kritische Schichten (unterbesetzt durch Abwesenheiten)
 */
router.get('/critical', authorize('ADMIN', 'MANAGER'), asyncHandler(getCriticalShifts));

/**
 * GET /api/dashboard/pending-approvals
 * Ausstehende Abwesenheits-Genehmigungen mit Kontext
 */
router.get('/pending-approvals', authorize('ADMIN', 'MANAGER'), asyncHandler(getPendingApprovals));

/**
 * GET /api/dashboard/warnings?days=7
 * Kapazitätswarnungen für nächste N Tage
 */
router.get('/warnings', authorize('ADMIN', 'MANAGER'), asyncHandler(getWarnings));

/**
 * GET /api/dashboard/stats
 * Übersichts-Statistiken für heute
 */
router.get('/stats', authorize('ADMIN', 'MANAGER'), asyncHandler(getStats));

export default router;
