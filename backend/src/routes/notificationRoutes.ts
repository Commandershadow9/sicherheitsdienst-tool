import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validate';
import { notificationTestSchema } from '../validations/notificationValidation';
import { sendTestNotification } from '../controllers/notificationController';

const router = Router();

router.post('/test', authenticate, validate(notificationTestSchema), asyncHandler(sendTestNotification));

export default router;

