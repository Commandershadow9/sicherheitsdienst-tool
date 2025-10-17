import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { createWriteRateLimit } from '../middleware/rateLimit';
import * as clearanceController from '../controllers/clearanceController';
import methodNotAllowed from '../middleware/methodNotAllowed';

const writeLimiter = createWriteRateLimit();

const router = Router();

// GET /api/clearances
router.get('/', authenticate, asyncHandler(clearanceController.getAllClearances));

// POST /api/clearances
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  writeLimiter,
  asyncHandler(clearanceController.createClearance),
);

// GET /api/clearances/:id
router.get('/:id', authenticate, asyncHandler(clearanceController.getClearanceById));

// PUT /api/clearances/:id
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  writeLimiter,
  asyncHandler(clearanceController.updateClearance),
);

// DELETE /api/clearances/:id
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  writeLimiter,
  asyncHandler(clearanceController.deleteClearance),
);

// POST /api/clearances/:id/complete-training - Training abschließen
router.post(
  '/:id/complete-training',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  writeLimiter,
  asyncHandler(clearanceController.completeTraining),
);

// POST /api/clearances/:id/revoke - Clearance widerrufen
router.post(
  '/:id/revoke',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  writeLimiter,
  asyncHandler(clearanceController.revokeClearance),
);

// 405
router.all('/', authenticate, methodNotAllowed(['GET', 'POST']));
router.all('/:id', authenticate, methodNotAllowed(['GET', 'PUT', 'DELETE']));
router.all('/:id/complete-training', authenticate, methodNotAllowed(['POST']));
router.all('/:id/revoke', authenticate, methodNotAllowed(['POST']));

export default router;
