import { Router } from 'express';
import { 
  getAllShifts, 
  createShift, 
  getShiftById, 
  updateShift, 
  deleteShift,
  assignUserToShift 
} from '../controllers/shiftController';

const router = Router();

// GET /api/shifts - Alle Schichten
router.get('/', getAllShifts);

// POST /api/shifts - Neue Schicht erstellen
router.post('/', createShift);

// GET /api/shifts/:id - Einzelne Schicht
router.get('/:id', getShiftById);

// PUT /api/shifts/:id - Schicht aktualisieren
router.put('/:id', updateShift);

// DELETE /api/shifts/:id - Schicht löschen
router.delete('/:id', deleteShift);

// POST /api/shifts/:id/assign - Mitarbeiter zur Schicht zuweisen
router.post('/:id/assign', assignUserToShift);

export default router;