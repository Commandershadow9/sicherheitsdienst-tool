import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createShiftSchema, updateShiftSchema } from '../validations/shiftValidation';
import * as shiftController from '../controllers/shiftController';

const router = Router();

// GET /api/shifts - Alle Schichten
router.get('/', authenticate, asyncHandler(shiftController.getAllShifts));

// POST /api/shifts - Neue Schicht erstellen
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'DISPATCHER'),
  validate(createShiftSchema),
  asyncHandler(shiftController.createShift)
);

// GET /api/shifts/:id - Einzelne Schicht
router.get('/:id', authenticate, asyncHandler(shiftController.getShiftById));

// PUT /api/shifts/:id - Schicht aktualisieren
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'DISPATCHER'),
  validate(updateShiftSchema),
  asyncHandler(shiftController.updateShift)
);

// DELETE /api/shifts/:id - Schicht löschen
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(shiftController.deleteShift)
);

// POST /api/shifts/:id/assign - Mitarbeiter zur Schicht zuweisen
router.post('/:id/assign', authenticate, asyncHandler(shiftController.assignUserToShift));
export default router;