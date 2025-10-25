import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createShiftSchema, updateShiftSchema, shiftListQuerySchema } from '../validations/shiftValidation';
import { clockInSchema, clockOutSchema } from '../validations/timeValidation';
import * as shiftController from '../controllers/shiftController';
import { createWriteRateLimit, createShiftAssignRateLimit, createShiftClockRateLimit } from '../middleware/rateLimit';
import methodNotAllowed from '../middleware/methodNotAllowed';

const writeLimiter = createWriteRateLimit();
const assignLimiter = createShiftAssignRateLimit();
const clockLimiter = createShiftClockRateLimit();

const router = Router();

// GET /api/shifts - Alle Schichten
router.get('/', authenticate, validate(shiftListQuerySchema), asyncHandler(shiftController.getAllShifts));

// POST /api/shifts - Neue Schicht erstellen
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'DISPATCHER'),
  writeLimiter,
  validate(createShiftSchema),
  asyncHandler(shiftController.createShift),
);

// GET /api/shifts/:id - Einzelne Schicht
router.get('/:id', authenticate, asyncHandler(shiftController.getShiftById));

// GET /api/shifts/:id/replacement-candidates/v2 - Intelligente Ersatzkandidaten mit Scoring (v1.8.0)
router.get(
  '/:id/replacement-candidates/v2',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'DISPATCHER'),
  asyncHandler(shiftController.getReplacementCandidatesV2),
);

// GET /api/shifts/:id/replacement-candidates-v2 - Intelligente Ersatzkandidaten mit Scoring (Legacy URL)
router.get(
  '/:id/replacement-candidates-v2',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'DISPATCHER'),
  asyncHandler(shiftController.getReplacementCandidatesV2),
);

// GET /api/shifts/:id/replacement-candidates - Ersatzkandidaten für eine Schicht (Legacy)
router.get(
  '/:id/replacement-candidates',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'DISPATCHER'),
  asyncHandler(shiftController.getShiftReplacementCandidates),
);

// GET /api/shifts/:id/assignment-candidates - Intelligente MA-Vorschläge für Schicht-Zuweisung
router.get(
  '/:id/assignment-candidates',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'DISPATCHER'),
  asyncHandler(shiftController.getShiftAssignmentCandidates),
);

// PUT /api/shifts/:id - Schicht aktualisieren
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'DISPATCHER'),
  writeLimiter,
  validate(updateShiftSchema),
  asyncHandler(shiftController.updateShift),
);

// DELETE /api/shifts/:id - Schicht löschen
router.delete('/:id', authenticate, authorize('ADMIN'), writeLimiter, asyncHandler(shiftController.deleteShift));

// POST /api/shifts/:id/assign - Mitarbeiter zur Schicht zuweisen
router.post(
  '/:id/assign',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'DISPATCHER'),
  assignLimiter,
  asyncHandler(shiftController.assignUserToShift),
);
// POST /api/shifts/:id/clock-in
router.post(
  '/:id/clock-in',
  authenticate,
  clockLimiter,
  validate(clockInSchema),
  asyncHandler(shiftController.clockIn),
);
// POST /api/shifts/:id/clock-out
router.post(
  '/:id/clock-out',
  authenticate,
  clockLimiter,
  validate(clockOutSchema),
  asyncHandler(shiftController.clockOut),
);
// 405
router.all('/', authenticate, methodNotAllowed(['GET', 'POST']));
router.all('/:id', authenticate, methodNotAllowed(['GET', 'PUT', 'DELETE']));
router.all('/:id/replacement-candidates/v2', authenticate, methodNotAllowed(['GET']));
router.all('/:id/replacement-candidates-v2', authenticate, methodNotAllowed(['GET']));
router.all('/:id/replacement-candidates', authenticate, methodNotAllowed(['GET']));
router.all('/:id/assignment-candidates', authenticate, methodNotAllowed(['GET']));
router.all('/:id/assign', authenticate, methodNotAllowed(['POST']));
router.all('/:id/clock-in', authenticate, methodNotAllowed(['POST']));
router.all('/:id/clock-out', authenticate, methodNotAllowed(['POST']));
export default router;
