import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createSiteSchema, updateSiteSchema } from '../validations/siteValidation';
import * as siteController from '../controllers/siteController';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// GET /api/sites
router.get('/', authenticate, asyncHandler(siteController.getAllSites));

// POST /api/sites
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'DISPATCHER'),
  validate(createSiteSchema),
  asyncHandler(siteController.createSite),
);

// GET /api/sites/:id
router.get('/:id', authenticate, asyncHandler(siteController.getSiteById));

// PUT /api/sites/:id
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'DISPATCHER'),
  validate(updateSiteSchema),
  asyncHandler(siteController.updateSite),
);

// DELETE /api/sites/:id
router.delete('/:id', authenticate, authorize('ADMIN'), asyncHandler(siteController.deleteSite));

export default router;

