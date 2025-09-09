import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validate';
import { notificationTestSchema } from '../validations/notificationValidation';
import { sendTestNotification } from '../controllers/notificationController';
import { notificationsRBAC } from '../middleware/rbac';
import { notificationsTestRateLimit } from '../middleware/rateLimit';
import methodNotAllowed from '../middleware/methodNotAllowed';

const router = Router();

router.post(
  '/test',
  authenticate,
  notificationsRBAC,
  notificationsTestRateLimit,
  validate(notificationTestSchema),
  asyncHandler(sendTestNotification),
);

// 405
router.all('/test', authenticate, methodNotAllowed(['POST']));

export default router;
