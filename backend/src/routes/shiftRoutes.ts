import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler'; // Import asyncHandler
import * as shiftController from '../controllers/shiftController'; // Updated import style

const router = Router();

// GET /api/shifts - Retrieve all shifts
router.get('/', asyncHandler(shiftController.getAllShifts));

// POST /api/shifts - Create a new shift
router.post('/', asyncHandler(shiftController.createShift));

// GET /api/shifts/:id - Get a specific shift
router.get('/:id', asyncHandler(shiftController.getShiftById));

// PUT /api/shifts/:id - Update a shift
router.put('/:id', asyncHandler(shiftController.updateShift));

// DELETE /api/shifts/:id - Delete a shift
router.delete('/:id', asyncHandler(shiftController.deleteShift));

// POST /api/shifts/:id/assign - Assign a user to a shift
router.post('/:id/assign', asyncHandler(shiftController.assignUserToShift));
export default router;
