import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { eventListQuerySchema, createEventSchema, updateEventSchema } from '../validations/eventValidation';
import * as eventController from '../controllers/eventController';
import { createWriteRateLimit } from '../middleware/rateLimit';
import methodNotAllowed from '../middleware/methodNotAllowed';

const router = Router();
const writeLimiter = createWriteRateLimit();

router.get('/', authenticate, validate(eventListQuerySchema), asyncHandler(eventController.listEvents));
router.post('/', authenticate, authorize('ADMIN', 'DISPATCHER'), writeLimiter, validate(createEventSchema), asyncHandler(eventController.createEvent));
router.get('/:id', authenticate, asyncHandler(eventController.getEventById));
router.put('/:id', authenticate, authorize('ADMIN', 'DISPATCHER'), writeLimiter, validate(updateEventSchema), asyncHandler(eventController.updateEvent));
router.delete('/:id', authenticate, authorize('ADMIN'), writeLimiter, asyncHandler(eventController.deleteEvent));

// 405
router.all('/', authenticate, methodNotAllowed(['GET', 'POST']));
router.all('/:id', authenticate, methodNotAllowed(['GET', 'PUT', 'DELETE']));

export default router;
