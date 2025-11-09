/**
 * Shift Planning Routes (v2.0)
 * Erweiterte Schichtplanungs-Endpunkte
 */

import { Router } from 'express';
import * as controller from '../controllers/shiftPlanningController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();

// Auth-Middleware für alle Routen
router.use(authenticate);

// ===== SHIFT TEMPLATES =====

router.get('/templates', authorize(['ADMIN', 'MANAGER', 'DISPATCHER']), controller.listTemplates);

router.get('/templates/:id', authorize(['ADMIN', 'MANAGER', 'DISPATCHER']), controller.getTemplate);

router.post('/templates', authorize(['ADMIN', 'MANAGER']), controller.createTemplate);

router.patch('/templates/:id', authorize(['ADMIN', 'MANAGER']), controller.updateTemplate);

router.delete('/templates/:id', authorize(['ADMIN']), controller.deleteTemplate);

router.post('/templates/:id/apply', authorize(['ADMIN', 'MANAGER']), controller.applyTemplate);

// ===== CONFLICT ANALYSIS =====

router.get('/conflicts', authorize(['ADMIN', 'MANAGER', 'DISPATCHER']), controller.analyzeConflicts);

router.get(
  '/conflicts/:shiftId',
  authorize(['ADMIN', 'MANAGER', 'DISPATCHER']),
  controller.getShiftConflicts
);

// ===== AUTO-FILL =====

router.post('/auto-fill', authorize(['ADMIN', 'MANAGER', 'DISPATCHER']), controller.autoFillShifts);

router.post(
  '/auto-fill-period',
  authorize(['ADMIN', 'MANAGER', 'DISPATCHER']),
  controller.autoFillPeriod
);

// ===== DEVELOPMENT/SETUP =====

router.post('/seed-templates', authorize(['ADMIN']), controller.seedTemplates);

export default router;
