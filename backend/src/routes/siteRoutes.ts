import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createSiteSchema, updateSiteSchema } from '../validations/siteValidation';
import * as siteController from '../controllers/siteController';
import * as documentController from '../controllers/documentController';
import * as siteIncidentController from '../controllers/siteIncidentController';
import { asyncHandler } from '../middleware/asyncHandler';
import { siteListQuerySchema } from '../validations/siteValidation';
import * as shiftController from '../controllers/shiftController';
import { createWriteRateLimit } from '../middleware/rateLimit';
import methodNotAllowed from '../middleware/methodNotAllowed';
import { uploadDocument } from '../middleware/uploadDocument';

const writeLimiter = createWriteRateLimit();

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

// ===== Dokumente-Management =====

// GET /api/sites/:siteId/documents
router.get('/:siteId/documents', authenticate, asyncHandler(documentController.getSiteDocuments));

// GET /api/sites/:siteId/documents/:id/versions
router.get('/:siteId/documents/:id/versions', authenticate, asyncHandler(documentController.getDocumentVersions));

// GET /api/sites/:siteId/documents/:id/download
router.get('/:siteId/documents/:id/download', authenticate, asyncHandler(documentController.downloadDocument));

// GET /api/sites/:siteId/documents/:id
router.get('/:siteId/documents/:documentId', authenticate, asyncHandler(documentController.getDocumentById));

// POST /api/sites/:siteId/documents
router.post(
  '/:siteId/documents',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  writeLimiter,
  uploadDocument.single('document'), // Multer-Middleware: erwartet 'document' als Feldname
  asyncHandler(documentController.uploadDocument),
);

// PUT /api/sites/:siteId/documents/:id
router.put(
  '/:siteId/documents/:documentId',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  writeLimiter,
  asyncHandler(documentController.updateDocument),
);

// DELETE /api/sites/:siteId/documents/:id
router.delete(
  '/:siteId/documents/:documentId',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  writeLimiter,
  asyncHandler(documentController.deleteDocument),
);

// ===== Vorfälle/Wachbuch-Management =====

// GET /api/sites/:siteId/incidents
router.get('/:siteId/incidents', authenticate, asyncHandler(siteIncidentController.getSiteIncidents));

// GET /api/sites/:siteId/incidents/:id
router.get('/:siteId/incidents/:id', authenticate, asyncHandler(siteIncidentController.getIncidentById));

// POST /api/sites/:siteId/incidents
router.post(
  '/:siteId/incidents',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'EMPLOYEE'),
  writeLimiter,
  asyncHandler(siteIncidentController.createIncident),
);

// PUT /api/sites/:siteId/incidents/:id
router.put(
  '/:siteId/incidents/:id',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  writeLimiter,
  asyncHandler(siteIncidentController.updateIncident),
);

// PUT /api/sites/:siteId/incidents/:id/resolve
router.put(
  '/:siteId/incidents/:id/resolve',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  writeLimiter,
  asyncHandler(siteIncidentController.resolveIncident),
);

// DELETE /api/sites/:siteId/incidents/:id
router.delete(
  '/:siteId/incidents/:id',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  writeLimiter,
  asyncHandler(siteIncidentController.deleteIncident),
);

// 405
router.all('/', authenticate, methodNotAllowed(['GET', 'POST']));
router.all('/:id', authenticate, methodNotAllowed(['GET', 'PUT', 'DELETE']));
router.all('/:siteId/shifts', authenticate, methodNotAllowed(['GET']));
router.all('/:id/images', authenticate, methodNotAllowed(['GET', 'POST']));
router.all('/:siteId/images/:imageId', authenticate, methodNotAllowed(['DELETE']));
router.all('/:id/assignments', authenticate, methodNotAllowed(['GET', 'POST']));
router.all('/:siteId/assignments/:assignmentId', authenticate, methodNotAllowed(['DELETE']));
router.all('/:id/coverage-stats', authenticate, methodNotAllowed(['GET']));
router.all('/:siteId/documents', authenticate, methodNotAllowed(['GET', 'POST']));
router.all('/:siteId/documents/:documentId', authenticate, methodNotAllowed(['GET', 'PUT', 'DELETE']));
router.all('/:siteId/documents/:id/versions', authenticate, methodNotAllowed(['GET']));
router.all('/:siteId/documents/:id/download', authenticate, methodNotAllowed(['GET']));
router.all('/:siteId/incidents', authenticate, methodNotAllowed(['GET', 'POST']));
router.all('/:siteId/incidents/:id', authenticate, methodNotAllowed(['GET', 'PUT', 'DELETE']));
router.all('/:siteId/incidents/:id/resolve', authenticate, methodNotAllowed(['PUT']));
export default router;
