import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { eventListQuerySchema, createEventSchema, updateEventSchema } from '../validations/eventValidation';
import * as eventController from '../controllers/eventController';

const router = Router();

router.get('/', authenticate, validate(eventListQuerySchema), asyncHandler(eventController.listEvents));
router.post('/', authenticate, authorize('ADMIN', 'DISPATCHER'), validate(createEventSchema), asyncHandler(eventController.createEvent));
router.get('/:id', authenticate, asyncHandler(eventController.getEventById));
router.put('/:id', authenticate, authorize('ADMIN', 'DISPATCHER'), validate(updateEventSchema), asyncHandler(eventController.updateEvent));
router.delete('/:id', authenticate, authorize('ADMIN'), asyncHandler(eventController.deleteEvent));

export default router;
