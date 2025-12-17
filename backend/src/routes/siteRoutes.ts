import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createSiteSchema, updateSiteSchema } from '../validations/siteValidation';
import * as siteController from '../controllers/siteController';
import * as siteImageController from '../controllers/siteImageController';
import * as siteAssignmentController from '../controllers/siteAssignmentController';
import * as siteAnalyticsController from '../controllers/siteAnalyticsController';
import * as documentController from '../controllers/documentController';
import * as siteIncidentController from '../controllers/siteIncidentController';
import * as securityConceptController from '../controllers/securityConceptController';
import * as shiftRuleController from '../controllers/shiftRuleController';
import { asyncHandler } from '../middleware/asyncHandler';
import { siteListQuerySchema } from '../validations/siteValidation';
import * as shiftController from '../controllers/shiftController';
import { createWriteRateLimit } from '../middleware/rateLimit';
import methodNotAllowed from '../middleware/methodNotAllowed';
import { uploadDocument } from '../middleware/uploadDocument';
import { uploadAttachment } from '../middleware/uploadAttachment';
import { validateMagicBytes } from '../middleware/validateMagicBytes';

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
router.get('/:id/images', authenticate, asyncHandler(siteImageController.getSiteImages));

// POST /api/sites/:id/images
router.post(
  '/:id/images',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'DISPATCHER'),
  writeLimiter,
  asyncHandler(siteImageController.uploadSiteImage),
);

// DELETE /api/sites/:siteId/images/:imageId
router.delete(
  '/:siteId/images/:imageId',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  writeLimiter,
  asyncHandler(siteImageController.deleteSiteImage),
);

// ===== Zuweisungen-Management =====

// GET /api/sites/:id/assignments
router.get('/:id/assignments', authenticate, asyncHandler(siteAssignmentController.getSiteAssignments));

// POST /api/sites/:id/assignments
router.post(
  '/:id/assignments',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  writeLimiter,
  asyncHandler(siteAssignmentController.createSiteAssignment),
);

// DELETE /api/sites/:siteId/assignments/:assignmentId
router.delete(
  '/:siteId/assignments/:assignmentId',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  writeLimiter,
  asyncHandler(siteAssignmentController.deleteSiteAssignment),
);

// ===== Coverage-Stats =====

// GET /api/sites/:id/coverage-stats
router.get('/:id/coverage-stats', authenticate, asyncHandler(siteAnalyticsController.getSiteCoverageStats));

// ===== Qualifikations-Check & Intelligente Zuweisung =====

// POST /api/sites/:id/check-qualification - Qualifikations-Abgleich für User
router.post(
  '/:id/check-qualification',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'DISPATCHER'),
  asyncHandler(siteAssignmentController.checkUserQualification),
);

// GET /api/sites/:id/assignment-candidates - Intelligente MA-Vorschläge
router.get(
  '/:id/assignment-candidates',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'DISPATCHER'),
  asyncHandler(siteAssignmentController.getAssignmentCandidates),
);

// ===== Schicht-Verwaltung =====

// GET /api/sites/:siteId/shifts - Schichten abrufen
router.get(
  '/:siteId/shifts',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'DISPATCHER', 'EMPLOYEE'),
  asyncHandler(shiftController.getShiftsForSite),
);

// POST /api/sites/:id/generate-shifts - Schichten generieren
router.post(
  '/:id/generate-shifts',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'DISPATCHER'),
  writeLimiter,
  asyncHandler(siteAnalyticsController.generateShiftsForSite),
);

// ===== Kontrollgang-Vorschläge =====

// GET /api/sites/:id/control-round-suggestions - Intelligente Kontrollgang-Vorschläge
router.get(
  '/:id/control-round-suggestions',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'DISPATCHER'),
  asyncHandler(siteAnalyticsController.getControlRoundSuggestions),
);

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
  validateMagicBytes(['pdf', 'png', 'jpg']),
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

// GET /api/sites/:siteId/incidents/:id/history
router.get('/:siteId/incidents/:id/history', authenticate, asyncHandler(siteIncidentController.getIncidentHistory));

// ===== Sicherheitskonzept-Management =====

// GET /api/sites/:siteId/security-concepts - Alle Sicherheitskonzepte (Historie)
router.get(
  '/:siteId/security-concepts',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  asyncHandler(securityConceptController.getAllSecurityConcepts),
);

// GET /api/sites/:siteId/security-concept - Aktuelles/neuestes Sicherheitskonzept
router.get(
  '/:siteId/security-concept',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'DISPATCHER'),
  asyncHandler(securityConceptController.getSecurityConcept),
);

// GET /api/sites/:siteId/security-concept/:id - Einzelnes Sicherheitskonzept
router.get(
  '/:siteId/security-concept/:id',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'DISPATCHER'),
  asyncHandler(securityConceptController.getSecurityConceptById),
);

// POST /api/sites/:siteId/security-concept - Neues Sicherheitskonzept erstellen
router.post(
  '/:siteId/security-concept',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  writeLimiter,
  asyncHandler(securityConceptController.createSecurityConcept),
);

// PUT /api/sites/:siteId/security-concept/:id - Sicherheitskonzept aktualisieren
router.put(
  '/:siteId/security-concept/:id',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  writeLimiter,
  asyncHandler(securityConceptController.updateSecurityConcept),
);

// POST /api/sites/:siteId/security-concept/:id/approve - Sicherheitskonzept freigeben
router.post(
  '/:siteId/security-concept/:id/approve',
  authenticate,
  authorize('ADMIN'),
  writeLimiter,
  asyncHandler(securityConceptController.approveSecurityConcept),
);

// DELETE /api/sites/:siteId/security-concept/:id - Sicherheitskonzept löschen
router.delete(
  '/:siteId/security-concept/:id',
  authenticate,
  authorize('ADMIN'),
  writeLimiter,
  asyncHandler(securityConceptController.deleteSecurityConcept),
);

// POST /api/sites/:siteId/security-concept/:id/upload-attachment - Anhang hochladen
router.post(
  '/:siteId/security-concept/:id/upload-attachment',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  writeLimiter,
  uploadAttachment.single('file'),
  validateMagicBytes(['pdf', 'png', 'jpg']),
  asyncHandler(securityConceptController.uploadAttachment),
);

// PATCH /api/sites/:siteId/security-concept/:id/shift-model - ShiftModel Auto-Sync Update
router.patch(
  '/:siteId/security-concept/:id/shift-model',
  authenticate,
  writeLimiter,
  asyncHandler(securityConceptController.updateShiftModel),
);

// ===== Schichtplanungs-Regeln (Shift Rules) =====

// GET /api/sites/:siteId/shift-rules - Alle Schichtregeln abrufen
router.get(
  '/:siteId/shift-rules',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'DISPATCHER'),
  asyncHandler(shiftRuleController.getShiftRules),
);

// GET /api/sites/:siteId/shift-rules/:ruleId - Einzelne Regel abrufen
router.get(
  '/:siteId/shift-rules/:ruleId',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'DISPATCHER'),
  asyncHandler(shiftRuleController.getShiftRule),
);

// POST /api/sites/:siteId/shift-rules - Neue Schichtregel erstellen
router.post(
  '/:siteId/shift-rules',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  writeLimiter,
  asyncHandler(shiftRuleController.createShiftRule),
);

// PUT /api/sites/:siteId/shift-rules/:ruleId - Schichtregel aktualisieren
router.put(
  '/:siteId/shift-rules/:ruleId',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  writeLimiter,
  asyncHandler(shiftRuleController.updateShiftRule),
);

// DELETE /api/sites/:siteId/shift-rules/:ruleId - Schichtregel löschen
router.delete(
  '/:siteId/shift-rules/:ruleId',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  writeLimiter,
  asyncHandler(shiftRuleController.deleteShiftRule),
);

// POST /api/sites/:siteId/shift-rules/check-conflicts - Konflikte prüfen
router.post(
  '/:siteId/shift-rules/check-conflicts',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'DISPATCHER'),
  asyncHandler(shiftRuleController.checkRuleConflicts),
);

// POST /api/sites/:siteId/shift-rules/generate-shifts - Schichten aus Regeln generieren
router.post(
  '/:siteId/shift-rules/generate-shifts',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'DISPATCHER'),
  writeLimiter,
  asyncHandler(shiftRuleController.generateShiftsFromRules),
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
router.all('/:id/check-qualification', authenticate, methodNotAllowed(['POST']));
router.all('/:id/assignment-candidates', authenticate, methodNotAllowed(['GET']));
router.all('/:id/generate-shifts', authenticate, methodNotAllowed(['POST']));
router.all('/:siteId/documents', authenticate, methodNotAllowed(['GET', 'POST']));
router.all('/:siteId/documents/:documentId', authenticate, methodNotAllowed(['GET', 'PUT', 'DELETE']));
router.all('/:siteId/documents/:id/versions', authenticate, methodNotAllowed(['GET']));
router.all('/:siteId/documents/:id/download', authenticate, methodNotAllowed(['GET']));
router.all('/:siteId/incidents', authenticate, methodNotAllowed(['GET', 'POST']));
router.all('/:siteId/incidents/:id', authenticate, methodNotAllowed(['GET', 'PUT', 'DELETE']));
router.all('/:siteId/incidents/:id/resolve', authenticate, methodNotAllowed(['PUT']));
router.all('/:siteId/incidents/:id/history', authenticate, methodNotAllowed(['GET']));
router.all('/:siteId/security-concepts', authenticate, methodNotAllowed(['GET']));
router.all('/:siteId/security-concept', authenticate, methodNotAllowed(['GET', 'POST']));
router.all('/:siteId/security-concept/:id', authenticate, methodNotAllowed(['GET', 'PUT', 'DELETE']));
router.all('/:siteId/security-concept/:id/approve', authenticate, methodNotAllowed(['POST']));
router.all('/:siteId/security-concept/:id/upload-attachment', authenticate, methodNotAllowed(['POST']));
router.all('/:siteId/security-concept/:id/shift-model', authenticate, methodNotAllowed(['PATCH']));
router.all('/:siteId/shift-rules', authenticate, methodNotAllowed(['GET', 'POST']));
router.all('/:siteId/shift-rules/:ruleId', authenticate, methodNotAllowed(['GET', 'PUT', 'DELETE']));
router.all('/:siteId/shift-rules/check-conflicts', authenticate, methodNotAllowed(['POST']));
router.all('/:siteId/shift-rules/generate-shifts', authenticate, methodNotAllowed(['POST']));

export default router;
