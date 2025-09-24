import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validate';
import { notificationTestSchema } from '../validations/notificationValidation';
import {
  sendTestNotification,
  listNotificationTemplates,
  getMyNotificationPreferences,
  updateMyNotificationPreferences,
  streamNotificationEvents,
} from '../controllers/notificationController';
import { notificationsRBAC } from '../middleware/rbac';
import { authorize } from '../middleware/auth';
import { notificationsTestRateLimit } from '../middleware/rateLimit';
import methodNotAllowed from '../middleware/methodNotAllowed';
import { notificationPreferenceSchema } from '../validations/notificationValidation';

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

router.get('/templates', authenticate, notificationsRBAC, listNotificationTemplates);
router.all('/templates', authenticate, methodNotAllowed(['GET']));

router.get('/preferences/me', authenticate, asyncHandler(getMyNotificationPreferences));
router.put(
  '/preferences/me',
  authenticate,
  validate(notificationPreferenceSchema),
  asyncHandler(updateMyNotificationPreferences),
);
router.all('/preferences/me', authenticate, methodNotAllowed(['GET', 'PUT']));

router.get('/events', authenticate, authorize('ADMIN', 'MANAGER', 'DISPATCHER'), streamNotificationEvents);
router.all('/events', authenticate, methodNotAllowed(['GET']));

export default router;
