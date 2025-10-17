import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createSiteSchema, updateSiteSchema } from '../validations/siteValidation';
import * as siteController from '../controllers/siteController';
import { asyncHandler } from '../middleware/asyncHandler';
import { siteListQuerySchema } from '../validations/siteValidation';
import * as shiftController from '../controllers/shiftController';
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

// ===== Bilder-Management =====

// GET /api/sites/:id/images
router.get('/:id/images', authenticate, asyncHandler(siteController.getSiteImages));

// POST /api/sites/:id/images
router.post(
  '/:id/images',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'DISPATCHER'),
  writeLimiter,
  asyncHandler(siteController.uploadSiteImage),
);

// DELETE /api/sites/:siteId/images/:imageId
router.delete(
  '/:siteId/images/:imageId',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  writeLimiter,
  asyncHandler(siteController.deleteSiteImage),
);

// ===== Zuweisungen-Management =====

// GET /api/sites/:id/assignments
router.get('/:id/assignments', authenticate, asyncHandler(siteController.getSiteAssignments));

// POST /api/sites/:id/assignments
router.post(
  '/:id/assignments',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  writeLimiter,
  asyncHandler(siteController.createSiteAssignment),
);

// DELETE /api/sites/:siteId/assignments/:assignmentId
router.delete(
  '/:siteId/assignments/:assignmentId',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  writeLimiter,
  asyncHandler(siteController.deleteSiteAssignment),
);

// ===== Coverage-Stats =====

// GET /api/sites/:id/coverage-stats
router.get('/:id/coverage-stats', authenticate, asyncHandler(siteController.getSiteCoverageStats));

// 405
router.all('/', authenticate, methodNotAllowed(['GET', 'POST']));
router.all('/:id', authenticate, methodNotAllowed(['GET', 'PUT', 'DELETE']));
router.all('/:siteId/shifts', authenticate, methodNotAllowed(['GET']));
router.all('/:id/images', authenticate, methodNotAllowed(['GET', 'POST']));
router.all('/:siteId/images/:imageId', authenticate, methodNotAllowed(['DELETE']));
router.all('/:id/assignments', authenticate, methodNotAllowed(['GET', 'POST']));
router.all('/:siteId/assignments/:assignmentId', authenticate, methodNotAllowed(['DELETE']));
router.all('/:id/coverage-stats', authenticate, methodNotAllowed(['GET']));
export default router;
