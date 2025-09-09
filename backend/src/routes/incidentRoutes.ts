import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import * as incidentController from '../controllers/incidentController';
import { validate } from '../middleware/validate';
import { incidentCreateSchema, incidentListQuerySchema, incidentUpdateSchema } from '../validations/incidentValidation';
import methodNotAllowed from '../middleware/methodNotAllowed';

const router = Router();

// List (auth: any authenticated)
router.get('/', authenticate, validate(incidentListQuerySchema), asyncHandler(incidentController.listIncidents));

// Create (ADMIN, MANAGER)
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), validate(incidentCreateSchema), asyncHandler(incidentController.createIncident));

// Get by id (auth: any authenticated)
router.get('/:id', authenticate, asyncHandler(incidentController.getIncident));

// Update (ADMIN, MANAGER)
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), validate(incidentUpdateSchema), asyncHandler(incidentController.updateIncident));

// Delete (ADMIN, MANAGER)
router.delete('/:id', authenticate, authorize('ADMIN', 'MANAGER'), asyncHandler(incidentController.deleteIncident));

// 405 handlers with auth
router.all('/', authenticate, methodNotAllowed(['GET', 'POST']));
router.all('/:id', authenticate, methodNotAllowed(['GET', 'PUT', 'DELETE']));

export default router;
