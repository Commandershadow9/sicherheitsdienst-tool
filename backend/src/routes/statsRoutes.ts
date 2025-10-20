import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as statsController from '../controllers/statsController';
import { asyncHandler } from '../middleware/asyncHandler';
import methodNotAllowed from '../middleware/methodNotAllowed';

const router = Router();

// GET /api/stats/critical-incidents
router.get(
  '/critical-incidents',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'DISPATCHER'),
  asyncHandler(statsController.getCriticalIncidents)
);

// GET /api/stats/incidents-by-site
router.get(
  '/incidents-by-site',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'DISPATCHER'),
  asyncHandler(statsController.getIncidentsBySite)
);

// 405
router.all('/critical-incidents', authenticate, methodNotAllowed(['GET']));
router.all('/incidents-by-site', authenticate, methodNotAllowed(['GET']));

export default router;
