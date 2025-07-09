import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler'; // Importiere den asyncHandler
import * as shiftController from '../controllers/shiftController'; // Geänderter Import-Stil

const router = Router();

// GET /api/shifts - Alle Schichten
router.get('/', asyncHandler(shiftController.getAllShifts));

// POST /api/shifts - Neue Schicht erstellen
router.post('/', asyncHandler(shiftController.createShift));

// GET /api/shifts/:id - Einzelne Schicht
router.get('/:id', asyncHandler(shiftController.getShiftById));

// PUT /api/shifts/:id - Schicht aktualisieren
router.put('/:id', asyncHandler(shiftController.updateShift));

// DELETE /api/shifts/:id - Schicht löschen
router.delete('/:id', asyncHandler(shiftController.deleteShift));

// POST /api/shifts/:id/assign - Mitarbeiter zur Schicht zuweisen
router.post('/:id/assign', asyncHandler(shiftController.assignUserToShift));

export default router;