import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createSiteSchema, updateSiteSchema } from '../validations/siteValidation';
import * as siteController from '../controllers/siteController';
import { asyncHandler } from '../middleware/asyncHandler';
import { siteListQuerySchema } from '../validations/siteValidation';
import * as shiftController from '../controllers/shiftController';
import { shiftListQuerySchema } from '../validations/shiftValidation';
import { createWriteRateLimit } from '../middleware/rateLimit';

const writeLimiter = createWriteRateLimit();
import methodNotAllowed from '../middleware/methodNotAllowed';

const router = Router();

// GET /api/sites
router.get('/', authenticate, validate(siteListQuerySchema), asyncHandler(siteController.getAllSites));

// POST /api/sites
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'DISPATCHER'),
  writeLimiter,
  validate(createSiteSchema),
  asyncHandler(siteController.createSite),
);

// GET /api/sites/:id
router.get('/:id', authenticate, asyncHandler(siteController.getSiteById));

// GET /api/sites/:siteId/shifts – Schichten einer Site (unterstützt CSV/XLSX via Accept)
router.get(
  '/:siteId/shifts',
  authenticate,
  // optional: gleiche Query-Validierung wie /shifts (derzeit nicht genutzt, Response ist Array)
  // validate(shiftListQuerySchema),
  asyncHandler(shiftController.getShiftsForSite),
);

// PUT /api/sites/:id
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'DISPATCHER'),
  writeLimiter,
  validate(updateSiteSchema),
  asyncHandler(siteController.updateSite),
);

// DELETE /api/sites/:id
router.delete('/:id', authenticate, authorize('ADMIN'), writeLimiter, asyncHandler(siteController.deleteSite));

// 405
router.all('/', authenticate, methodNotAllowed(['GET', 'POST']));
router.all('/:id', authenticate, methodNotAllowed(['GET', 'PUT', 'DELETE']));
router.all('/:siteId/shifts', authenticate, methodNotAllowed(['GET']));
export default router;
